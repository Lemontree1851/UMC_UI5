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
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            var oContextBinding = this.getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
                "$expand": "_AssignPlant,_AssignCompany,_AssignSalesOrg,_AssignPurchOrg,_AssignRole($expand=_UserRoleAccessBtn)"
            });
            oContextBinding.requestObject().then(function (context) {
                var aAccessBtns = [],
                    aAllAccessBtns = [];
                if (context._AssignRole && context._AssignRole.length > 0) {
                    context._AssignRole.forEach(role => {
                        aAccessBtns.push(role._UserRoleAccessBtn);
                    });
                    aAllAccessBtns = aAccessBtns.flat();
                }
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: this.getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                this.getModel("local").setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-View"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-Export"),
                        Summary: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-Summary"),
                        PurchaseList: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-PurchaseList"),
                        PurchaseListExport: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryrequirement-PurchaseListExport")
                    },
                    data: {
                        PlantSet: context._AssignPlant,
                        CompanySet: context._AssignCompany,
                        SalesOrgSet: context._AssignSalesOrg,
                        PurchOrgSet: context._AssignPurchOrg,
                        RoleSet: context._AssignRole
                    }
                });
            }.bind(this), function (oError) {
                if (!this.oErrorMessageDialog) {
                    this.oErrorMessageDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        state: "Error",
                        content: new sap.m.Text({
                            text: this.getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
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
            var aProcessObject = aMainData.filter(obj => obj.Classification == "5.DEMAND" || obj.Classification == "R.BALANCE");
            var aPurchaseList = [];
            this._myBusyDialog.open();
            for (var j = 0; j < aProcessObject.length; j++) {
                if (aProcessObject[j].Classification == "5.DEMAND") {
                    // 5.DEMAND
                    var oDemandRow = aProcessObject[j];
                    // 利用可能数量
                    var iAvailableQty = 0;
                    continue;
                }
                if (aProcessObject[j].Classification == "R.BALANCE") {
                    var iExcuteTimes = 1;
                    for (const field in aProcessObject[j]) {
                        if (field.substring(0, 3) === "YMD" || field.substring(0, 2) === "YW" || field.substring(0, 2) === "YM") {
                            var oRequestDate, oOrderDate;
                            if (field.substring(0, 3) === "YMD") {
                                oRequestDate = new Date(field.substring(3, 7) + "/" + field.substring(7, 9) + "/" + field.substring(9, 11));
                                oOrderDate = new Date(field.substring(3, 7) + "/" + field.substring(7, 9) + "/" + field.substring(9, 11));
                            } else if (field.substring(0, 2) === "YW") {
                                // 周的第一天
                                oRequestDate = this.getFirstDayOfWeek(field.substring(2, 6), field.substring(6, 8));
                                oOrderDate = this.getFirstDayOfWeek(field.substring(2, 6), field.substring(6, 8));
                            } else if (field.substring(0, 2) === "YM") {
                                // 月的第二个工作日
                                oRequestDate = this.getSecondWorkday(field.substring(2, 6), field.substring(6, 8));
                                oOrderDate = this.getFirstDayOfWeek(field.substring(2, 6), field.substring(6, 8));
                            }

                            // 找 R.BALANCE < 0 的第一列(所以只执行一次)
                            if (iExcuteTimes > 0 && parseFloat(aProcessObject[j][field]) < 0) {
                                iExcuteTimes -= 1;
                                var iBalance = parseFloat(aProcessObject[j][field]) + iAvailableQty;
                                // 基数 = Balance / 最低発注数量 向上取整
                                var iCardinality = Math.ceil(Math.abs(iBalance) / parseFloat(aProcessObject[j].MinimumPurchaseOrderQty));
                                // 発注数 = 最低発注数量 * 基数
                                var iOrderQuantity = parseFloat(aProcessObject[j].MinimumPurchaseOrderQty) * iCardinality;
                                // 利用可能数量
                                iAvailableQty = iOrderQuantity + iBalance;

                                aPurchaseList.push({
                                    Supplier: aProcessObject[j].Supplier,
                                    SupplierName: aProcessObject[j].SupplierName,
                                    Product: aProcessObject[j].Product,
                                    ProductDescription: aProcessObject[j].ProductDescription,
                                    SupplierMaterialNumber: aProcessObject[j].SupplierMaterialNumber,
                                    ProductManufacturerNumber: aProcessObject[j].ProductManufacturerNumber,
                                    OrderDate: this.formatDateStr(this.getNDaysBefore(oOrderDate, parseFloat(aProcessObject[j].MaterialPlannedDeliveryDurn))),
                                    OrderQuantity: iOrderQuantity,
                                    RequestDate: this.formatDateStr(oRequestDate),
                                    Balance: iBalance,
                                    MaterialPlannedDeliveryDurn: aProcessObject[j].MaterialPlannedDeliveryDurn,// 納入予定日数
                                    MinimumPurchaseOrderQty: aProcessObject[j].MinimumPurchaseOrderQty,// 最低発注数量
                                });
                                continue;
                            }

                            if (iExcuteTimes === 0) {
                                iBalance = parseFloat(oDemandRow[field]) + iAvailableQty;
                                iAvailableQty += parseFloat(oDemandRow[field]);
                                if (iBalance < 0) {
                                    // 基数 = Balance / 最低発注数量 向上取整
                                    iCardinality = Math.ceil(Math.abs(iBalance) / parseFloat(aProcessObject[j].MinimumPurchaseOrderQty));
                                    // 発注数 = 最低発注数量 * 基数
                                    iOrderQuantity = parseFloat(aProcessObject[j].MinimumPurchaseOrderQty) * iCardinality;
                                    // 利用可能数量
                                    iAvailableQty = iOrderQuantity + iBalance;

                                    aPurchaseList.push({
                                        Supplier: aProcessObject[j].Supplier,
                                        SupplierName: aProcessObject[j].SupplierName,
                                        Product: aProcessObject[j].Product,
                                        ProductDescription: aProcessObject[j].ProductDescription,
                                        SupplierMaterialNumber: aProcessObject[j].SupplierMaterialNumber,
                                        ProductManufacturerNumber: aProcessObject[j].ProductManufacturerNumber,
                                        OrderDate: this.formatDateStr(this.getNDaysBefore(oOrderDate, parseFloat(aProcessObject[j].MaterialPlannedDeliveryDurn))),
                                        OrderQuantity: iOrderQuantity,
                                        RequestDate: this.formatDateStr(oRequestDate),
                                        Balance: iBalance,
                                        MaterialPlannedDeliveryDurn: aProcessObject[j].MaterialPlannedDeliveryDurn,
                                        MinimumPurchaseOrderQty: aProcessObject[j].MinimumPurchaseOrderQty,
                                    });
                                }
                            }
                        }
                    }
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

        onExport: function () {
            var oTable = this.byId("idListTable");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("title");
            this._exportExcel(oTable, sFileName);
        },

        onExportPurchaseList: function () {
            var oTable = sap.ui.getCore().byId("idPurchaseListTable");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("PurchaseList");
            this._exportExcel(oTable, sFileName);
        },

        _exportExcel: function (oTable, sFileName) {
            var sPath = oTable.getBindingPath("rows");
            var aExcelSet = this.getModel("local").getProperty(sPath) ? this.getModel("local").getProperty(sPath) : [];
            var aExcelCol = [];
            var aTableCol = oTable.getColumns();
            for (var i = 0; i < aTableCol.length; i++) {
                if (aTableCol[i].getVisible()) {
                    var sLabelText = aTableCol[i].getAggregation("label").getText();
                    var sType, sTextAlign, bDelimiter, iScale;
                    var sFieldName = aTableCol[i].getAggregation("template").mBindingInfos.text.parts[0].path;
                    switch (sFieldName) {
                        //  Number 分隔符
                        case "SupplierPrice":
                        case "StandardPrice":
                        case "RequiredQty":
                        case "StockQty":
                        case "SuppliedQty":
                        case "AvailableStock":
                        case "RemainingQty":
                        case "SafetyStock":
                        case "ShipmentNoticeQty":
                        case "PastQty":
                        case "FutureQty":
                        case "TotalQty":
                        case "OrderQuantity":
                        case "Balance":
                        case "MinimumPurchaseOrderQty":
                        case "MaterialPlannedDeliveryDurn":
                            sType = sap.ui.export.EdmType.Number;
                            bDelimiter = true;
                            iScale = 3;
                            sTextAlign = "End";
                            break;
                        case "MaterialPlannedDeliveryDurn":
                            sType = sap.ui.export.EdmType.Number;
                            bDelimiter = true;
                            sTextAlign = "End";
                            break;
                        default:
                            sType = sap.ui.export.EdmType.String;
                            sTextAlign = "Begin";
                            break;
                    }
                    if (sFieldName.substring(0, 3) === "YMD" || sFieldName.substring(0, 2) === "YW" || sFieldName.substring(0, 2) === "YM") {
                        sType = sap.ui.export.EdmType.Number;
                        bDelimiter = true;
                        iScale = 3;
                        sTextAlign = "End";
                    }
                    var oExcelCol = {
                        label: sLabelText,
                        type: sType,
                        property: aTableCol[i].getAggregation("template").getBindingPath("text"),
                        width: parseFloat(aTableCol[i].getWidth()),
                        textAlign: sTextAlign,
                        delimiter: bDelimiter,
                        scale: iScale
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
                fileName: sFileName + "_" + this.getCurrentDateTime() + ".xlsx"
            };
            // export excel file
            new Spreadsheet(oSettings).build();
        }
    });
});