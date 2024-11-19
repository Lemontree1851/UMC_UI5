sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Base, formatter, Filter, FilterOperator) {
    "use strict";

    return Base.extend("mm.zpurchasepricevariance.controller.Main", {

        formatter: formatter,

        onInit: function () {

        },

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                aNewFilters = [];
            var bExcludeDeliveredPO = this.getModel("local").getProperty("/ExcludeDeliveredPO");
            if (bExcludeDeliveredPO) {
                aNewFilters.push(new Filter("IsCompletelyDelivered", FilterOperator.EQ, false));
                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: false
                });
                aFilters.push(oNewFilter);
            }
        },

        onBeforeExport: function (oEvent) {
            var mExcelSettings = oEvent.getParameter("exportSettings");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("appTitle");
            this._exportExcel(mExcelSettings, sFileName);
        },

        _exportExcel: function (mExcelSettings, sFileName) {
            mExcelSettings.workbook.columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    //  Date
                    case "PurchaseOrderDate":
                    case "ScheduleLineDeliveryDate":
                    case "DeliveryDate":
                    case "PostingDate":
                    case "ConditionValidityStartDate":
                    case "ConditionValidityEndDate":
                    case "PurgDocPriceDate":
                    case "PriceDate":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break;
                    //  Number 分隔符 没有小数位
                    case "CurrentPrice":
                    case "NewPrice":
                    case "Difference":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.scale = 3;
                        oColumn.textAlign = "End";
                        break;
                    case "OrderQuantity":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.scale = 2;
                        oColumn.textAlign = "End";
                        break;
                    case "NetPriceQuantity":
                    case "ConditionQuantity":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        break;
                }
            });
            mExcelSettings.fileName = sFileName + "_" + this.getCurrentDateTime();
        }
    });
});
