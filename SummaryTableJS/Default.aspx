<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="SummaryTableJS._Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <script src="Scripts/jquery-1.7.1.min.js" type="text/javascript"></script>
    <script src="Scripts/staticCommon.js" type="text/javascript"></script>
    <script src="Scripts/common.js" type="text/javascript"></script>
    <script src="Scripts/data.js" type="text/javascript"></script>
    <script src="Scripts/summaryTable.js" type="text/javascript"></script>
    <style type="text/css">
        table{
            border-collapse:collapse;
        }
        td{
            border:1px solid black;
        }
    </style>
</head>
<body>
    <form id="form1" runat="server">
    <div>
    <table id="testSummaryTable">
        <thead>
            <tr>
                <td>单位</td>
                <td>状态</td>
                <td>强度等级</td>
                <td>任务单号</td>
                <td>计划生产量</td>
                <td>盘次数</td>
                <td>合计</td>
            </tr>
        </thead>
        <tbody>

        </tbody>
    </table>
    </div>
    </form>
</body>
</html>
<script type="text/javascript">
    var data = testData.rows;
    var config = [
        { field: 'CompanyID', isGroupField: true },
        { field: 'TaskStatus', isGroupField: true, nameSource: { 1: '未开工', 3: '已完成', 0: '未审核' } },
        { field: 'StrengthGrade', isGroupField: true },
        { field: 'TaskNumber' },
        { field: 'SupplyNum', vSum: true, hSum: true },
        { field: 'PanCount',vSum:true,hSum:true }
    ];
    $(function () {
        var st = new SummaryTable(data, config);
        $('#testSummaryTable tbody').html(st.setTBody());
    })
</script>
