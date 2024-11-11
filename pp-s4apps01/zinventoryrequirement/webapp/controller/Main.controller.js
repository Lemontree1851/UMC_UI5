sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text"
], function (Base, formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment, UIColumn, Label, Text) {
    "use strict";

    return Base.extend("pp.zinventoryrequirement.controller.Main", {

        formatter: formatter,

        onInit: function () {

        },

        onSearch: function (oEvent) {
            var aFilters = this.byId("idSmartFilterBar").getFilters();

            var sDisplayUnit = this.getModel("local").getProperty("/filter/DisplayUnit");
            var sDisplayDimension = this.getModel("local").getProperty("/filter/DisplayDimension");
            var sSelectionRule = this.getModel("local").getProperty("/filter/SelectionRule");
            var sShowInformation = this.getModel("local").getProperty("/filter/ShowInformation");
            var sShowDetailLines = this.getModel("local").getProperty("/filter/ShowDetailLines");
            var sShowDEMAND = this.getModel("local").getProperty("/filter/ShowDEMAND");

            aFilters.push(new Filter("DisplayUnit", FilterOperator.EQ, sDisplayUnit));
            aFilters.push(new Filter("DisplayDimension", FilterOperator.EQ, sDisplayDimension));
            aFilters.push(new Filter("SelectionRule", FilterOperator.EQ, sSelectionRule));
            aFilters.push(new Filter("ShowInformation", FilterOperator.EQ, sShowInformation === "X" ? true : false));
            aFilters.push(new Filter("ShowDetailLines", FilterOperator.EQ, sShowDetailLines === "X" ? true : false));
            aFilters.push(new Filter("ShowDEMAND", FilterOperator.EQ, sShowDEMAND === "X" ? true : false));

            this._CallODataV2("READ", "/ZC_InventoryRequirement", aFilters, {}, {}).then(function (oResponse) {
                var aResults = [];
                if (oResponse.results[0]) {
                    aResults = JSON.parse(oResponse.results[0].DynamicData);
                }
                this.getModel("local").setProperty("/resultSet", aResults);
                if (aResults.length > 0) {
                    this._renderingColumns(aResults[0]);
                } else {
                    MessageBox.error("No Data");
                }
            }.bind(this), function (oError) {
                MessageBox.error(oError);
            }.bind(this));
        },

        _renderingColumns: function (object) {
            var oTable = this.byId("idListTable");
            oTable.removeAllColumns();
            for (const key in object) {
                var sTextAlign, bvisible;
                switch (key) {
                    case "IndustrystandardName":
                    case "EOLGroup":
                    case "IsMainProduct":
                    case "Supplier":
                    case "SupplierName":
                    case "SupplierMaterialNumber":
                    case "ProductManufacturerNumber":
                    case "ManufacturerNumber":
                    case "MaterialPlannedDeliveryDurn":
                    case "MinimumPurchaseOrderQty":
                    case "SupplierPrice":
                    case "SupplierCertoriginCountry":
                        bvisible = "{= ${local>/filter/ShowDetailLines} === 'X'}";
                        break;
                    default:
                        bvisible = true;
                        break;
                }
                switch (key) {
                    case "MinimumPurchaseOrderQty":
                    case "SupplierPrice":
                    case "StandardPrice":
                        sTextAlign = "End";
                        break;
                    default:
                        sTextAlign = "Begin"
                        break;
                }
                var oColumn = new UIColumn({
                    width: "10rem",
                    label: new Label({ text: "{i18n>" + key + "}" }),
                    hAlign: sTextAlign,
                    visible: bvisible,
                    template: new Text({ text: "{local>" + key + "}", wrapping: false })
                });
                // oColumn = new UIColumn({
                //     width: "10rem",
                //     label: new Label({ text: "{i18n>" + key + "}" }),
                //     hAlign: "End",
                //     template: new Text({ text: "{ path:'local>" + key + "',formatter:'.formatter.formatFloat'}", wrapping: false })
                // });
                oTable.addColumn(oColumn);
            }
        }
    });
});
