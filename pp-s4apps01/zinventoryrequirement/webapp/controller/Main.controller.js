sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/export/Spreadsheet"
], function (Base, formatter, BusyDialog, MessageBox, Filter, FilterOperator, Fragment, UIColumn, Label, Text, Spreadsheet) {
    "use strict";

    return Base.extend("pp.zinventoryrequirement.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this._oTable = this.byId("idListTable");
            this._myBusyDialog = new BusyDialog();
        },

        onSearch: function () {
            var aFilters = this.byId("idSmartFilterBar").getFilters();
            var sPeriodEndDate = this.byId("idSmartFilterBar").getControlByKey("PeriodEndDate").getValue().replace(/\D/g, '');
            var sCurrentDate = this.getCurrentUTCDateTime().substring(0, 8);
            if (sPeriodEndDate < sCurrentDate) {
                MessageBox.error(this.getModel("i18n").getResourceBundle().getText("PeriodEndDateIsPast"));
                return;
            }
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
                    MessageBox.error(this.getModel("i18n").getResourceBundle().getText("NoData"));
                }
            }.bind(this), function (oError) {
                MessageBox.error(oError);
            }.bind(this));

            // button
            this.getModel("local").setProperty("/visible/Summary", "X");
            this.getModel("local").setProperty("/visible/PurchaseList", "");
        },

        _renderingColumns: function (object) {
            var aEndColumns = [];
            for (const key in object) {
                if (key === "BaseUnit" || key === "Currency") {
                    continue;
                }
                var oColumn, oLabel, oTemplate, sTextAlign, bvisible;
                switch (key) {
                    case "IndustryStandardName":
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
            // button
            this.getModel("local").setProperty("/visible/Summary", "X");
            this.getModel("local").setProperty("/visible/PurchaseList", "");
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
            this._myBusyDialog.open();
            for (var m = 0; m < aMainData.length; m++) {
                for (var n = 0; n < aItemData.length; n++) {
                    if (aItemData[n].EOLGroup !== aMainData[m].EOLGroup || aItemData[n].Classification !== aMainData[m].Classification) {
                        continue;
                    }
                    for (const field in aItemData[n]) {
                        if (field.substring(0, 3) === "YMD" || field.substring(0, 2) === "YW" || field.substring(0, 2) === "YM") {
                            aMainData[m][field] = parseFloat(aMainData[m][field]) + parseFloat(aItemData[n][field]);
                        }
                    }
                }
            }
            this.getModel("local").setProperty("/resultSet", aMainData);

            // button
            this.getModel("local").setProperty("/visible/Summary", "");
            this.getModel("local").setProperty("/visible/PurchaseList", "X");
            this._myBusyDialog.close();
        },

        onPurchaseList: function () {
            var aMainData = this.getModel("local").getProperty("/resultSet");
            var aGroupKey = this._removeDuplicates(aMainData, ["Product"]);
            var aPurchaseList = [];
            this._myBusyDialog.open();
            for (var i = 0; i < aGroupKey.length; i++) {
                // 品目
                var sProduct = aGroupKey[i].Product;
                // 最小発注数
                var sMinimumPurchaseOrderQty = aGroupKey[i].MinimumPurchaseOrderQty;
                // 納入予定日数
                var sMaterialPlannedDeliveryDurn = aGroupKey[i].MaterialPlannedDeliveryDurn;

                for (var j = 0; j < aMainData.length; j++) {
                    var oRow = aMainData[j];

                    aPurchaseList.push({
                        Supplier: "",
                        SupplierName: "",
                        Product: "",
                        ProductDescription: "",
                        SupplierMaterialNumber: "",
                        ProductManufacturerNumber: "",
                        OrderDate: "",
                        OrderQuantity: "",
                        RequestDate: "",
                        Balance: "",
                        MaterialPlannedDeliveryDurn: "",
                        MinimumPurchaseOrderQty: ""
                    });
                }
            }
            this.getModel("local").setProperty("/PurchaseList", aPurchaseList);
            this.showPurchaseListDialog();
        },

        showPurchaseListDialog: function () {
            var that = this;
            this._myBusyDialog.open();
            Fragment.load({
                name: "pp.zinventoryrequirement.fragments.PurchaseList",
                controller: this
            }).then(function (oDialog) {
                //ダイアログがロードされたら
                this._oPurchaseListDialog = oDialog;
                //ダイアログからモデルを使用できるようにする
                this.getView().addDependent(this._oPurchaseListDialog);
                this._oPurchaseListDialog.addButton(new sap.m.Button({
                    text: "{i18n>CloseBtn}",
                    press: function () {
                        that.getModel("local").setProperty("/PurchaseList", []);
                        that._oPurchaseListDialog.destroy();
                    }
                }));
                this._myBusyDialog.close();
                this._oPurchaseListDialog.open();
            }.bind(this));
        },

        onExportPurchaseList: function () {
            var oTable = sap.ui.getCore().byId("idPurchaseListTable");
            var sPath = oTable.getBindingPath("rows");
            var aExcelSet = this.getModel("local").getProperty(sPath) ? this.getModel("local").getProperty(sPath) : [];
            var aExcelCol = [];
            var aTableCol = oTable.getColumns();
            for (var i = 0; i < aTableCol.length; i++) {
                if (aTableCol[i].getVisible()) {
                    var sLabelText = aTableCol[i].getAggregation("label").getText();
                    var sType, sTextAlign, sUnitProperty;
                    switch (aTableCol[i].mBindingInfos.label.parts[0].path) {
                        //  Date
                        case "OrderDate":
                        case "RequestDate":
                            sType = sap.ui.export.EdmType.Date;
                            break;
                        //  Number 分隔符 没有小数位
                        case "OrderQuantity":
                        case "Balance":
                        case "MinimumPurchaseOrderQty":
                            sType = sap.ui.export.EdmType.Number;
                            sTextAlign = "End";
                            sUnitProperty = "BaseUnit";
                            break;
                        //  Number 分隔符 没有小数位
                        case "MaterialPlannedDeliveryDurn":
                            sType = sap.ui.export.EdmType.Number;
                            sTextAlign = "End";
                            break;
                        default:
                            sType = sap.ui.export.EdmType.String;
                            sTextAlign = "Begin";
                            sUnitProperty = "";
                            break;
                    }
                    var oExcelCol = {
                        label: sLabelText,
                        type: sType,
                        property: aTableCol[i].getAggregation("template").getBindingPath("text"),
                        width: parseFloat(aTableCol[i].getWidth()),
                        textAlign: sTextAlign,
                        unitProperty: sUnitProperty
                    };
                    aExcelCol.push(oExcelCol);
                }
            }
            var oSettings = {
                workbook: {
                    columns: aExcelCol,
                    context: {
                        version: "1.54",
                        hierarchyLevel: "level"
                    }
                },
                dataSource: aExcelSet,
                fileName: this.getModel("i18n").getResourceBundle().getText("PurchaseList") + "_" + this.getCurrentDateTime() + ".xlsx"
            };
            // export excel file
            new Spreadsheet(oSettings).build();
        }
    });
});