sap.ui.define([
    "./Base",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "../model/formatter"
], function (Base, Filter, FilterOperator, BusyDialog, MessageBox, formatter) {
    "use strict";

    return Base.extend("mm.purinfomasterlist.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
        },

        onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
            var mBindingParams = oEvent.getParameter("bindingParams");

            var sZTYPE1 = this.byId("ZTYPE1").getSelected();
            var newFilter;
            if (sZTYPE1 === true) {
                newFilter = new sap.ui.model.Filter("Ztype1", sap.ui.model.FilterOperator.EQ, "X");
            } else {
                newFilter = new sap.ui.model.Filter("Ztype1", sap.ui.model.FilterOperator.EQ, "");
            }
            mBindingParams.filters.push(newFilter);
            var sZTYPE2 = this.byId("ZTYPE2").getSelected();

            if (sZTYPE2 === true) {
                newFilter = new sap.ui.model.Filter("Ztype2", sap.ui.model.FilterOperator.EQ, "X");
            } else {
                newFilter = new sap.ui.model.Filter("Ztype2", sap.ui.model.FilterOperator.EQ, "");
            }
            mBindingParams.filters.push(newFilter);

        },

        onBeforeExport: function (oEvent) {
            var mExcelSettings = oEvent.getParameter("exportSettings");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("Result");
            mExcelSettings.workbook.columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    //  Date
                    case "condition_validity_start_date":
                    case "condition_validity_end_date":
                    case "CreationDate_1":
                    case "CreationDate_2":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break;
                    //  Currency 分隔符 小数位
                    // case "NetPriceAmount":
                    // case "ConditionRateValue":
                    // case "UnitPrice_plnt":
                    //     oColumn.type = sap.ui.export.EdmType.Currency;
                    //     oColumn.delimiter = true;
                    //     oColumn.textAlign = "End";
                    //     break;
                    case "standardpurchaseorderquantity":
                    case "Taxprice":
                    case "UnitPrice_standard":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.scale = 3
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        break;
                    //  Number 分隔符 没有小数位
                    case "MaterialPriceUnitQty":
                    case "PriceUnitQty":
                    case "NetPriceAmount":
                    case "ConditionRateValue":
                    case "ConditionScaleQuantity":
                    // case "standardpurchaseorderquantity":
                    // case "Taxprice":
                    case "UnitPrice_plnt":
                    // case "UnitPrice_standard":
                    case "MaterialPlannedDeliveryDurn":
                    case "MinimumPurchaseOrderQuantity":
                    case "MaximumOrderQuantity":
                    case "UMCJPPurchasingPrice":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        // oColumn.unitProperty = "BaseUnit";
                        break;
                }
            });
            mExcelSettings.fileName = sFileName + "_" + this.getCurrentDateTime();
        }
    });
});