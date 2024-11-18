sap.ui.define([
    "../model/formatter",
    "sap/ui/core/mvc/Controller"
], function (formatter, Controller) {
    "use strict";

    return Controller.extend("sd.zsalesdocumentlist.controller.Main", {
        formatter: formatter,
        
        onInit: function () {

        },

        onsMrilterBarInitialized: function (oEvent) {
            var oSmartFilterBar = oEvent.getSource();
            // 设置默认值
            oSmartFilterBar.setFilterData({
      
            });
        },

        // 勾选Checkbox的响应
        onSelect: function (oEvent) {
           
        },

        // 点执行按钮后的响应
        onSearch: function (oEvent) {
           
        },

        // 点执行按钮后的响应
        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            var oBinding = oEvent.getParameter("bindingParams");

            oBinding.events = {
                "dataReceived": function (oEvent) {
                    var oReceivedData = oEvent.getParameter('data');
                    // 提取 SalesDocument 字段的值，并使用Set去除重复
                    var setSalesDocuments = new Set(oReceivedData.results.map(item => item.SalesDocument));
                    // 获取不重复的条目数
                    var iSoCount = setSalesDocuments.size;
                    var iSoItemCount = oReceivedData.results.length;
                    var headerText = this.getModel("i18n").getResourceBundle().getText("Results",[iSoCount,iSoItemCount]);
                    // 更新 SmartTable 的 header 文本
                    this.setHeader(headerText);
                },
                    //More event handling can be done here
              };

            // 根据选择框，添加过滤条件传值到后端
            var filters = oEvent.getParameters().bindingParams.filters;
            if(!filters){
                filters =[];
            }

            var sIndicator1 = this.byId("idCB1").getSelected();
            var sIndicator2 = this.byId("idCB2").getSelected();
            var sIndicator3 = this.byId("idCB3").getSelected();
            var sIndicator4 = this.byId("idCB4").getSelected();
            var sIndicator5 = this.byId("idCB5").getSelected();
            var sIndicator6 = this.byId("idCB6").getSelected();

            if (sIndicator1 === true) { 
                var oIndicator1Filter = new sap.ui.model.Filter({
                    path: "Indicator1",
                    operator: "EQ",
                    value1: sIndicator1
                });
                filters.push(oIndicator1Filter);
            }

            if (sIndicator2 === true) { 
                var oIndicator2Filter = new sap.ui.model.Filter({
                    path: "Indicator2",
                    operator: "EQ",
                    value1: sIndicator2
                });
                filters.push(oIndicator2Filter);
            }

            if (sIndicator3 === true) { 
                var oIndicator3Filter = new sap.ui.model.Filter({
                    path: "Indicator3",
                    operator: "EQ",
                    value1: sIndicator3
                });
                filters.push(oIndicator3Filter);
            }

            if (sIndicator4 === true) { 
                var oIndicator4Filter = new sap.ui.model.Filter({
                    path: "Indicator4",
                    operator: "EQ",
                    value1: sIndicator4
                });
                filters.push(oIndicator4Filter);
            }

            if (sIndicator5 === true) { 
                var oIndicator5Filter = new sap.ui.model.Filter({
                    path: "Indicator5",
                    operator: "EQ",
                    value1: sIndicator5
                });
                filters.push(oIndicator5Filter);
            }

            if (sIndicator6 === true) { 
                var oIndicator6Filter = new sap.ui.model.Filter({
                    path: "Indicator6",
                    operator: "EQ",
                    value1: sIndicator6
                });
                filters.push(oIndicator6Filter);
            }
        },

        // 点导出按钮后的响应
        onBeforeExport: function (oEvent) {
            var oSettings = oEvent.getParameter("exportSettings");
            var columns = oSettings.workbook.columns;
            // var dataSource = oSettings.dataSource;

            // oSettings.fileName = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("fileName");

            columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    case "DeliveryDate":
                    case "ConfirmedDeliveryDate":
                    case "ExchangeRateDate":
                    case "CreationDate":
                    case "CreationDateItem":
                    case "LastChangeDate":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break
                    case "OrderQuantity":
                    case "DeliveredQtyInOrderQtyUnit":
                    case "OpenConfdDelivQtyInOrdQtyUnit":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        // oColumn.delimiter =true;
                        // oColumn.textAlign ="End";
                        oColumn.unitProperty="OrderQuantityUnit";
                        break;
                    case "ComplDeliveredQtyInBaseUnit":
                    case "NoComplDeliveredQtyInBaseUnit":
                    case "EnternalTansferQtyInBaseUnit":
                    case "NoEnternalTansferQtyInBaseUnit":
                    case "BillingQuantityInBaseUnit":
                    case "NoBillingQuantityInBaseUnit":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.unitProperty="BaseUnit";
                        break;
                    case "ConditionAmountPPR0":
                    case "ConditionAmountTTX1":
                    case "ConditionAmountZPFC":
                    case "ConditionAmountZPST":
                    case "ConditionAmountZPIN":
                    case "ConditionAmountZPSB":
                    case "ConditionAmountZPSS":
                    case "ConditionAmountZPCM":
                    case "ConditionAmountZPGP": 
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.unitProperty="TransactionCurrency";
                        break;
                    default:
                        break;
                }
            });
        },
    });
});

