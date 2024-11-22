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
            // var purchasinginforecord = this.byId("purchasinginfo").getValue();
            //     var oPurchasingInfoRecordFilter = new sap.ui.model.Filter("purchasinginforecord", sap.ui.model.FilterOperator.EQ, purchasinginforecord);
            //     mBindingParams.filters.push(oPurchasingInfoRecordFilter);

            // var plant = this.byId("werks").getValue();
            //     var oPlantFilter = new sap.ui.model.Filter("plant", sap.ui.model.FilterOperator.EQ, plant);
            //     mBindingParams.filters.push(oPlantFilter);

            // var purchasingorganization = this.byId("ekorg").getValue();
            //     var oPurchasingOrganizationFilter = new sap.ui.model.Filter("purchasingorganization", sap.ui.model.FilterOperator.EQ, purchasingorganization);
            //     mBindingParams.filters.push(oPurchasingOrganizationFilter);

            // var material = this.byId("matnr").getValue();
            //     var oMaterialFilter = new sap.ui.model.Filter("material", sap.ui.model.FilterOperator.EQ, material);
            //     mBindingParams.filters.push(oMaterialFilter);

            // var suppliermaterialnumber = this.byId("suppliermaterialnumber").getValue();
            //     var oSupplierMaterialNumberFilter = new sap.ui.model.Filter("SupplierMaterialNumber", sap.ui.model.FilterOperator.EQ, suppliermaterialnumber);
            //     mBindingParams.filters.push(oSupplierMaterialNumberFilter);

            // var Supplier = this.byId("Supplier").getValue();
            //     var oSupplierFilter = new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, Supplier);
            //     mBindingParams.filters.push(oSupplierFilter);

            // var PurchasingGroup = this.byId("PurchasingGroup").getValue();
            //     var oPurchasingGroupFilter = new sap.ui.model.Filter("PurchasingGroup", sap.ui.model.FilterOperator.EQ, PurchasingGroup);
            //     mBindingParams.filters.push(oPurchasingGroupFilter);

            // var CreationDate_1 = this.byId("CreationDate_1").getValue();
            //     var oCreationDate1Filter = new sap.ui.model.Filter("CreationDate_1", sap.ui.model.FilterOperator.EQ, CreationDate_1);
            //     mBindingParams.filters.push(oCreationDate1Filter);

            // var CreationDate_2 = this.byId("CreationDate_2").getValue();
            //     var oCreationDate2Filter = new sap.ui.model.Filter("CreationDate_2", sap.ui.model.FilterOperator.EQ, CreationDate_2);
            //     mBindingParams.filters.push(oCreationDate2Filter);

            // var ManufacturerNumber = this.byId("ManufacturerNumber").getValue();
            //     var oManufacturerNumberFilter = new sap.ui.model.Filter("ManufacturerNumber", sap.ui.model.FilterOperator.EQ, ManufacturerNumber);
            //     mBindingParams.filters.push(oManufacturerNumberFilter);

            // var ProductManufacturerNumber = this.byId("ProductManufacturerNumber").getValue();
            //     var oProductManufacturerNumberFilter = new sap.ui.model.Filter("ProductManufacturerNumber", sap.ui.model.FilterOperator.EQ, ProductManufacturerNumber);
            //     mBindingParams.filters.push(oProductManufacturerNumberFilter);

            // var latestoffer = this.byId("latestoffer").getValue();
            //     var oLatestOfferFilter = new sap.ui.model.Filter("LatestOffer", sap.ui.model.FilterOperator.EQ, latestoffer);
            //     mBindingParams.filters.push(oLatestOfferFilter);

            // var SupplierIsFixed = this.byId("SupplierIsFixed").getSelectedKey();
            //     var oSupplierIsFixedFilter = new sap.ui.model.Filter("SupplierIsFixed", sap.ui.model.FilterOperator.EQ, SupplierIsFixed);
            //     mBindingParams.filters.push(oSupplierIsFixedFilter);

            // var IncotermsClassification = this.byId("IncotermsClassification").getValue();
            //     var oIncotermsClassificationFilter = new sap.ui.model.Filter("IncotermsClassification", sap.ui.model.FilterOperator.EQ, IncotermsClassification);
            //     mBindingParams.filters.push(oIncotermsClassificationFilter);

            // var PlusDay = this.byId("PlusDay").getValue();
            //     var oPlusDayFilter = new sap.ui.model.Filter("PlusDay", sap.ui.model.FilterOperator.EQ, PlusDay);
            //     mBindingParams.filters.push(oPlusDayFilter);
            // mBindingParams.filters.push(newFilter);
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
                    //  Number 分隔符 没有小数位
                    case "NetPriceAmount":
                    case "ConditionRateValue":
                    case "ConditionScaleQuantity":
                    case "standardpurchaseorderquantity":
                    case "Taxprice":
                    case "UnitPrice_plnt":
                    case "UnitPrice_standard":
                    case "MaterialPlannedDeliveryDurn":
                    case "MinimumPurchaseOrderQuantity":
                    case "MaximumOrderQuantity":
                    case "UMCJPPurchasingPrice":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        oColumn.unitProperty = "BaseUnit";
                        break;
                }
            });
            mExcelSettings.fileName = sFileName + "_" + this.getCurrentDateTime();
        }
    });
});