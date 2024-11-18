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
            this._oTable = this.byId("idListTable");
        },

        onSearch: function () {
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

            this.removeAllColumns();
            this._CallODataV2("READ", "/ZC_InventoryRequirement", aFilters, {}, {}).then(function (oResponse) {
                var aResults = [];
                if (oResponse.results[0]) {
                    aResults = JSON.parse(oResponse.results[0].DynamicData);
                }
                if (aResults.length > 0) {
                    this.getModel("local").setProperty("/resultSet", aResults);
                    this._renderingColumns(aResults[0]);
                } else {
                    MessageBox.error("No Data");
                }
            }.bind(this), function (oError) {
                MessageBox.error(oError);
            }.bind(this));
        },

        _renderingColumns: function (object) {
            var aEndColumns = [];
            for (const key in object) {
                if (key === "BaseUnit" || key === "Currency") {
                    continue;
                }
                var oColumn, oLabel, oTemplate, sTextAlign, bvisible;
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
                        bvisible = "{= ${local>/filter/ShowInformation} === 'X'}";
                        break;
                    case "FinalProduct":
                    case "HighLevelMaterial":
                        bvisible = "{= ${local>/filter/ShowDEMAND} === 'X'}";
                        break;
                    default:
                        bvisible = true;
                        break;
                }
                switch (key) {
                    case "MaterialPlannedDeliveryDurn":
                    case "MinimumPurchaseOrderQty":
                    case "RequiredQty":
                    case "ShipmentNoticeQty":
                    case "StockQty":
                    case "SafetyStock":
                    case "SuppliedQty":
                    case "AvailableStock":
                    case "RemainingQty":
                    case "SupplierPrice":
                    case "StandardPrice":
                    case "PastQty":
                    case "FutureQty":
                    case "TotalQty":
                        sTextAlign = "End";
                        break;
                    default:
                        sTextAlign = "Begin"
                        break;
                }

                oLabel = new Label({ text: "{i18n>" + key + "}" });
                if (key.substring(0, 3) === "YMD" || key.substring(0, 2) === "YW" || key.substring(0, 2) === "YM") {
                    oLabel = new Label({ text: key });
                    sTextAlign = "End";
                }
                if (sTextAlign === "End") {
                    oTemplate = new Text({
                        // text: "{ path:'local>" + key + "', formatter:'.formatter.formatFloat' }",
                        text: {
                            path: "local>" + key,
                            formatter: function (n) {
                                if (n) {
                                    var sign = "";
                                    if (typeof n === "string") {
                                        var bNegative = n.endsWith("-");
                                        if (bNegative) {
                                            n = "-" + n.substring(0, n.length - 1);
                                        }
                                    }
                                    var num = Number(n).toFixed(3);
                                    if (num < 0) {
                                        num = num.substring(1);
                                        sign = "-";
                                    }
                                    var re = /\d{1,3}(?=(\d{3})+$)/g;
                                    var n1 = num.toString().replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
                                        return s1.replace(re, "$&,") + s2;
                                    });
                                    if (sign === "-") {
                                        n1 = sign + n1;
                                    }
                                    return n1;
                                } else {
                                    return n;
                                }
                            }
                        },
                        wrapping: false
                    });
                } else {
                    oTemplate = new Text({
                        text: "{local>" + key + "}",
                        wrapping: false
                    });
                }

                oColumn = new UIColumn({
                    width: "10rem",
                    label: oLabel,
                    hAlign: sTextAlign,
                    visible: bvisible,
                    template: oTemplate
                });

                // 未来、合計 最後に置いてください
                if (key === "FutureQty" || key === "TotalQty") {
                    aEndColumns.push(oColumn);
                } else {
                    this._oTable.addColumn(oColumn);
                }
            }
            aEndColumns.forEach(oColumn => {
                this._oTable.addColumn(oColumn);
            });
        },

        removeAllColumns: function () {
            this._oTable.removeAllColumns();
            this.getModel("local").setProperty("/resultSet", []);
        },

        onSummary: function () {
            var aMainData = [];
            var aItemData = [];
            var aAllData = this.getModel("local").getProperty("/resultSet");
            // 項目「EOLグループ」に値が入っている明細行
            var aProcessObject = aAllData.filter(obj => obj.EOLGroup !== "");
            if (aProcessObject.length === 0) {
                this.getModel("local").setProperty("/resultSet", []);
                return;
            }
            // 合計できた内容を項目「主品目」がXなっている明細行に表示する
            aProcessObject.forEach(element => {
                if (element.IsMainProduct) {
                    aMainData.push(element);
                } else {
                    aItemData.push(element);
                }
            });
            for (var m = 0; m < aMainData.length; m++) {

                for (var n = 0; n < aItemData.length; n++) {
                    if (aItemData[n].EOLGroup !== aMainData[m].EOLGroup) {
                        continue;
                    }
                    for (const field in aItemData[n]) {

                    }
                }
            }
        }
    });
});