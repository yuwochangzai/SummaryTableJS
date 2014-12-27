/**
 * Provide error messages for debugging, with links to online explanation 
 */
function error(msg, stop) {
    if (stop) {
        throw msg;
    } else if (window.console) {
        console.log(msg);
    }
}

/**
 * 给对象属性值累计
 * @param {Object} 对象
 * @param {String} 属性名称
 * @param {Number} 累计的值
 */
function addValue(obj, property, value) {
    if (arguments.length < 3) {
        return;
    }
    //obj[property] = obj[property] == undefined ? value||0 : parseInt(obj[property]) + parseInt(value);
    obj[property] = obj[property] == undefined ? value || 0 : parseFloat(obj[property]) + parseFloat(value);
}

/**
 * Check for array
 * @param {Object} obj
 */
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
/**
 * Check for object
 * @param {Object} obj
 */
function isObject(obj) {
    return typeof obj === 'object';
}
/**
 * 判断是否为小数
 * @param {String} 待校验字符串
 */
function isFloat(str) {
    var reg = /^(-|\+)?\d+\.\d*$/;
    return reg.test(str);
}

/**
 * 数组克隆
 * @param {Array} 源数组
 * @param {Array} 新数组
 */
function cloneArray(arr, newArr) {
    if (newArr == undefined) {
        newArr = [];
    }
    for (var i in arr) {
        if (isArray(arr[i])) {
            newArr[i]=cloneArray(arr[i], newArr[i]);
        }
        else if(isObject(arr[i])){
            newArr[i] = goUtils.Extend({},arr[i]);
        }
        else {
            newArr[i] = arr[i];
        }
    }
    return newArr;
}
/**
 * 转换为UTC时间
 * @param {Date} jsDate 时间
 *
 * @return {Date} UTC整型时间(单位：毫秒)
 */
function convertToUTCInt(jsDate) {
    var y = jsDate.getFullYear();
    var m = jsDate.getMonth();
    var d = jsDate.getDate();
    var h = jsDate.getHours();
    var mi = jsDate.getMinutes();
    var s = jsDate.getSeconds();
    return Date.UTC(y, m, d, h, mi, s);
}

/**
 * 递归分组（分组前须先排序）
 * @param {Array} arrObj 原对象数组
 * @param {Array} newArr 分组后的新对象
 * @param {Array} groupFields 分组字段
 * @param {String} suffix 分组后的属性名后缀
 * @param {String} rowspanAttr rowspan属性名称，默认为"rowspan"
 * @param {Object} dictSumFields 小计字段字典
 */
function recursionGroup(arrObj, newArr, groupFields, suffix, rowspanAttr,dictSumFields) {
    if (groupFields.length > 0) {
        var groupField = groupFields[0];
        var oldArr = cloneArray(arrObj);
        if (isArray(newArr)) {
            newArr.length = 0;//清空数组
        }
        else {
            newArr = [];
        }
        if (rowspanAttr == undefined) {
            rowspanAttr = 'rowspan';
        }
        var lastObj;
        var tempGroupArr = [];//当前组的对象数组
        var sumObj = { colspan: groupFields.length };
        sumObj[groupField] = '小计';
        for (var i in oldArr) {
            var obj = oldArr[i];
            var isNew = false;
            if (lastObj == undefined || lastObj[groupField] != obj[groupField]) {
                isNew = true;
            }
            var sumProperty = groupField + suffix;//汇总属性名
            var newObj;
            if (isNew) {
                if (lastObj != undefined && groupFields.length > 1) {
                    //对上一组数据再分组
                    var restGroupFields = cloneArray(groupFields);
                    restGroupFields.shift();//删除刚分组过的字段
                    var lastGroupArr = tempGroupArr;
                    var rowspan = lastObj[sumProperty].length;
                    if (dictSumFields) {
                        rowspan += 1;
                    }
                    lastObj[rowspanAttr] = rowspan;//更新rowspan
                    recursionGroup(lastGroupArr, lastObj[sumProperty], restGroupFields, suffix, rowspanAttr,dictSumFields);
                }
                lastObj = {};
                lastObj[groupField] = obj[groupField];
                lastObj[sumProperty] = [obj];
                newArr.push(lastObj);
                tempGroupArr = [];//新的分组
            }
            else {
                lastObj[sumProperty].push(obj);
            }
            tempGroupArr.push(obj);
            if (i == arrObj.length - 1 && groupFields.length > 1) {
                //对最后一组再分组
                var endObj = newArr[newArr.length - 1];
                var restGroupFields = cloneArray(groupFields);
                restGroupFields.shift();//删除刚分组过的字段
                var rowspan = lastObj[sumProperty].length;
                if (dictSumFields) {
                    rowspan += 1;
                }
                lastObj[rowspanAttr] = rowspan;//更新rowspan
                recursionGroup(tempGroupArr, endObj[sumProperty], restGroupFields, suffix, rowspanAttr,dictSumFields);
            }
            if (groupFields.length == 1) {//最后一级的分组
                addValue(newArr[newArr.length - 1], rowspanAttr, 1);
            }
            if (dictSumFields) {
                for (var j in obj) {
                    if (dictSumFields.hasOwnProperty(j)) {
                        addValue(sumObj, j, obj[j]);
                    }
                }
            }
        }
        if (dictSumFields) {
            newArr.push(sumObj);
        }
    }
}

/// <reference path="../../../../js/common.js" />
var CommonUtils = {
    checkIsDate:function(strDate){
        var regDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
        var regDateTime = /^(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
        if(regDate.test(strDate)||regDateTime.test(strDate)){
            return true;
        }
        return false;
    },
    /**
     * 汇总数据为对象
     * @param {Array} source 数据源
     * @param {String} groupfield 分组字段名称
     * @param {String} sumfield 汇总字段名称
     * @param {Object} <分组字段值，汇总字段值>字典，其中对象属性为字典key值，对象属性值为汇总字段值
     */
    summaryDataToDict: function (source, groupfield, sumfield) {
        if (!source) {
            return null;
        }
        var dict = {};
        for (var i = 0; i < source.length; i++) {
            addValue(dict, source[i][groupfield], source[i][sumfield]);
        }
    },
    /**
     * 汇总数据为数组
     * @param {Array} source 数据源
     * @param {String} groupfield 分组字段名称
     * @param {String} sumfield 汇总字段名称
     * @param {Object} <分组字段值，汇总字段值>字典，其中对象属性为字典key值，对象属性值为汇总字段值
     */
    summaryDataToArray: function (source, groupfield, sumfield) {
        if (!source||source.length==0) {
            return null;
        }
        var isDate = this.checkIsDate(source[0][groupfield]);
        source.sort(function (x, y) {
            if (isDate) {
                return Date.StrToDate(x[groupfield]) - Date.StrToDate(y[groupfield]);
            }
            else {
                return x - y;
            }
        });
        var sumData = [], tempGroupValue,isNewGroup;
        for (var i = 0; i < source.length; i++) {
            var s = source[i];
            if (tempGroupValue == undefined || tempGroupValue != s[groupfield]) {
                isNewGroup = true;
                tempGroupValue = s[groupfield];
            }
            else {
                isNewGroup = false;
            }
            if (isNewGroup) {
                sumData.push({ id: s[groupfield], value: s[sumfield] });
            }
            else {
                addValue(sumData[sumData.length - 1], 'value', s[sumfield]);
            }
        }
        return sumData;
    }
}