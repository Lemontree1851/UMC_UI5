sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"
], function(MessageToast, Spreadsheet) {
    'use strict';

    return {
        savefilename: function() {
            // 获取当前时间戳
            var oDate = new Date();
            var sTimestamp = oDate.getFullYear().toString() +
                (oDate.getMonth() + 1).toString().padStart(2, '0') +
                oDate.getDate().toString().padStart(2, '0') + "_" +
                oDate.getHours().toString().padStart(2, '0') +
                oDate.getMinutes().toString().padStart(2, '0') +
                oDate.getSeconds().toString().padStart(2, '0');

            // 自定义文件名
            var sFileName = "嗷嗷嗷_" + sTimestamp;

            // 查找 SmartTable
            var this = that;
            var oView = this.getView();
            var oSmartTable;

            oView.findAggregatedObjects(true, function(oControl) {
                if (oControl.isA("sap.ui.comp.smarttable.SmartTable")) {
                    oSmartTable = oControl;
                    return true; // 找到 SmartTable 后停止搜索
                }
                return false;
            });

            if (!oSmartTable) {
                MessageToast.show("无法找到 SmartTable。");
                return;
            }

            // 获取绑定的实体集路径
            var sEntitySet = oSmartTable.getEntitySet();
            var oModel = this.getView().getModel(); // 假设默认的 OData 模型已经在视图中绑定

            // 从 OData 模型获取数据
            oModel.read("/" + sEntitySet, {
                success: function(oData) {
                    // 导出设置
                    var oExportSettings = {
                        workbook: {
                            columns: [
                                // 定义需要导出的列
                                { label: "列名1", property: "字段1" },
                                { label: "列名2", property: "字段2" },
                                // 添加更多列...
                            ]
                        },
                        dataSource: oData.results, // 导出 OData 获取的数据
                        fileName: sFileName + ".xlsx"
                    };

                    // 创建 Spreadsheet 实例并导出
                    var oSheet = new Spreadsheet(oExportSettings);
                    oSheet.build().then(function() {
                        MessageToast.show("文件 " + sFileName + " 导出成功！");
                    }).finally(function() {
                        oSheet.destroy();
                    });
                },
                error: function(oError) {
                    MessageToast.show("从 OData 获取数据失败！");
                }
            });
        }
    };
});
