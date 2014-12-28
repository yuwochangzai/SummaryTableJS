/// <reference path="common.js" />


/**
 * 汇总表格js
 */
(function () {
    var option = {
        rowspan: 'rowspan',
        colspan: 'colspan',
        suffix: 'S',
        hSumName: '合计',
        vSumName:'小计',
    };
    /**
     * @param {Array}  detailData 明细数据数组
     * @param {Array} config 数据配置:
     * * [ {field:companyID,nameSource:dictCompany,isGroupField:true},
            {field:NetWeight,hSum:true,vSum:true}
     * * ]
     */
    function SummaryTable(detaildata, fields) {
        this.detailData = detaildata;
        this.fields = fields;
        this.handleConfig();
    }

    SummaryTable.prototype.handleConfig = function () {
        this.config = {
            dictFields:{},//字段配置自动
            groupFields: [],
            unGroupFields:[],
            vSumFields: {},//纵向小计字段字典对象
            hSumFields: {},//横向合计字段字典对象
            blNeedVSum: false,
            blNeedHSum:false,
        };
        for (var i = 0; i < this.fields.length;i++) {
            var f = this.fields[i];
            this.config.dictFields[f.field] = f;
            if (f.isGroupField) {//是否分组字典
                this.config.groupFields.push(f.field);
            }
            else {
                this.config.unGroupFields.push(f.field);
            }
            if (f.hSum) {//是否需要横向合计
                if (!this.config.hSumFields.hasOwnProperty(f.field)) {
                    this.config.hSumFields[f.field]='';
                }
            }
            if (f.vSum) {//是否需要纵向小计
                if (!this.config.vSumFields.hasOwnProperty(f.field)) {
                    this.config.vSumFields[f.field] = '';
                }
            }
        }
        this.config.blNeedVSum = this.config.vSumFields && !isOwnEmpty(this.config.vSumFields);//是否需要纵向小计
        this.config.blNeedHSum = this.config.hSumFields && !isOwnEmpty(this.config.hSumFields);//是否需要横向小计
    }

    /**
     * 递归构造树结构汇总数据
     * @param {Array} arrSource 明细数据源
     * @param {Array} newArr 汇总后的数据
     * @param {Array} groupFields 分组字典
     */
    SummaryTable.prototype.recursionGroupData = function (arrSource, newArr, groupFields) {
        if (groupFields.length > 0) {
            var parent;
            if (arguments.length > 3) {
                parent = arguments[3];
            }
            var groupField = groupFields[0];
            var oldArr = cloneArray(arrSource);
            if (isArray(newArr)) {
                newArr.length = 0;//清空数组
            }
            else {
                newArr = [];
            }
            var rowspanAttr =option.rowspan,suffix=option.suffix;
            var lastObj;
            var tempGroupArr = [];//当前组的对象数组
            var sumObj = {};
            var blNeedVSum = this.config.blNeedVSum;//是否需要纵向小计
            var blNeedHSum = this.config.blNeedHSum;//是否需要横向小计
            sumObj[option.colspan] = groupFields.length;
            if (blNeedVSum) {
                sumObj[groupField] = option.vSumName;//小计
            }
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
                        if (blNeedVSum) {
                            rowspan += 1;
                            if (parent) {
                                addValue(parent,rowspanAttr, 1);
                            }
                        }
                        lastObj[rowspanAttr] = rowspan;//更新rowspan
                        this.recursionGroupData(lastGroupArr, lastObj[sumProperty], restGroupFields,lastObj);
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
                if (i == arrSource.length - 1 && groupFields.length > 1) {
                    //对最后一组再分组
                    var endObj = newArr[newArr.length - 1];
                    var restGroupFields = cloneArray(groupFields);
                    restGroupFields.shift();//删除刚分组过的字段
                    var rowspan = lastObj[sumProperty].length;
                    if (blNeedVSum) {
                        rowspan += 1;
                        if (parent) {
                            addValue(parent,rowspanAttr, 1);
                        }
                    }
                    lastObj[rowspanAttr] = rowspan;//更新rowspan
                    this.recursionGroupData(tempGroupArr, endObj[sumProperty], restGroupFields,lastObj);
                }
                if (groupFields.length == 1) {//最后一级的分组
                    addValue(newArr[newArr.length - 1], rowspanAttr, 1);
                    if (blNeedHSum) {
                        this.addHSumValue(obj);
                    }
                }
                if (blNeedVSum) {
                    for (var j in obj) {
                        if (this.config.vSumFields.hasOwnProperty(j)) {
                            addValue(sumObj, j, obj[j]);
                        }
                    }
                }
            }
            if (blNeedVSum) {
                if (blNeedHSum) {
                    this.addHSumValue(sumObj);
                }
                newArr.push(sumObj);
            }
        }
    }

    /**
     * 新增横向合计值
     */
    SummaryTable.prototype.addHSumValue = function (detailobj) {
        for (var i in detailobj) {
            if (this.config.hSumFields.hasOwnProperty(i)) {
                addValue(detailobj, option.hSumName, detailobj[i]);
            }
        }
    }

    /**
     * 构造表格内容html
     */
    SummaryTable.prototype.setTBody = function () {
        var data = this.summaryData();
        return '<tr>'+this.recursionSetTBodyHtml(data, this.config.groupFields);
    }

    /**
     * 汇总数据
     */
    SummaryTable.prototype.summaryData = function () {
        var self = this;
        //先将明细数据排序
        this.detailData.sort(function (x, y) {
            for (i = 0; i < self.config.groupFields.length; i++) {
                var field = self.config.groupFields[i];
                if (x[field] != y[field]) {
                    return x[field] - y[field];
                }
            }
            return 0;
        });
        var data = [];
        this.recursionGroupData(this.detailData, data, this.config.groupFields);
        return data;
    }

    /**
     * 递归构造表格内容html
     */
    SummaryTable.prototype.recursionSetTBodyHtml = function (arrData,groupFields) {
        var tr = '';
        if (groupFields.length > 0) {
            var groupField = groupFields[0];
            for (var i = 0; i < arrData.length; i++) {
                var group = arrData[i];
                var fieldValue = group[groupField];
                if (i > 0) {
                    tr += '<tr>';
                }
                //小计行
                if (i == arrData.length - 1 && this.config.blNeedVSum) {
                    tr += '<td colspan="' + group[option.colspan] + '">' + fieldValue + '</td>';
                    tr += this.setUnGroupFieldsTdHtml(group);
                    if (this.config.blNeedHSum) {
                        tr += '<td>' + group[option.hSumName] + '</td>';
                    }
                    tr += '</tr>';
                }
                else {
                    tr += '<td rowspan="' + group[option.rowspan] + '">' + this.setFieldDisplayValue(groupField, fieldValue) + '</td>';
                    var groups = group[groupField + option.suffix];
                    if (groups) {
                        var cloneGroupFields = cloneArray(groupFields);
                        cloneGroupFields.shift();
                        tr += this.recursionSetTBodyHtml(groups, cloneGroupFields);
                    }
                }
            }
        }
        else {
            for (var i = 0; i < arrData.length; i++) {
                var detail = arrData[i];
                if (i > 0) {
                    tr += '<tr>';
                }
                tr += this.setUnGroupFieldsTdHtml(detail);
                if (this.config.blNeedHSum) {
                    tr += '<td>' + detail[option.hSumName] + '</td>';
                }
                tr += '</tr>';
            }
        }
        return tr;
    }

    /**
     * 构造非分组字段td内容
     * @param {Object} detail 单行明细数据
     */
    SummaryTable.prototype.setUnGroupFieldsTdHtml = function (detail) {
        var td = '';
        for (var i = 0; i < this.config.unGroupFields.length; i++) {
            td += '<td>';
            var field = this.config.unGroupFields[i];
            td += this.setFieldDisplayValue(field,detail[field]);
            td += '</td>';
        }
        return td;
    }

    /**
     * 构造字段显示值
     * @param {String} field 字段名称
     * @param {Object} value 字段值
     */
    SummaryTable.prototype.setFieldDisplayValue = function (field, value) {
        var fieldConfig = this.config.dictFields[field];
        var displayValue = value;
        if (fieldConfig&&fieldConfig.nameSource&&!isOwnEmpty(fieldConfig.nameSource)) {
            displayValue=fieldConfig.nameSource[value];
        }
        if (displayValue == undefined) {
            displayValue = '';
        }
        return displayValue;
    }


    /*
     * 检测对象是否是空对象(不包含任何可读属性)。
     * 方法只既检测对象本身的属性，不检测从原型继承的属性。
     */
    function isOwnEmpty(obj) {
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                return false;
            }
        }
        return true;
    };

    window.SummaryTable = window.SummaryTable ? error('已定义SummaryTable', true) : SummaryTable;
})();