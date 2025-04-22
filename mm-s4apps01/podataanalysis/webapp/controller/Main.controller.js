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

    return Base.extend("mm.podataanalysis.controller.Main", {

        formatter: formatter,

        onInit: function () {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "podataanalysis-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "podataanalysis-View"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "podataanalysis-Export"),
                        MRPSynchronous: aAllAccessBtns.some(btn => btn.AccessId === "podataanalysis-MRPSynchronous"),
                    },
                    data: {
                        PlantSet: context._AssignPlant,
                        CompanySet: context._AssignCompany,
                        SalesOrgSet: context._AssignSalesOrg,
                        PurchOrgSet: context._AssignPurchOrg,
                        RoleSet: context._AssignRole
                    }
                });
                this._myBusyDialog.open();
                this._CallODataV2("MRP", "ACTION", "/GetMRPSynchronousTime", [], {}, {}).then(function (oResponse) {
                    this._myBusyDialog.close();
                    var oResult = JSON.parse(oResponse.GetMRPSynchronousTime.Zzkey);
                    var oMessageStrip = this.byId("idMRPSynchronousMsg");
                    var oButton = this.byId("idMRPSynchronous");
                    var sType = "",
                        sText = "";
                    var sDateTime = oResult.SCHEDULEEND === "" ? oResult.SCHEDULEBEGIN : oResult.SCHEDULEEND;
                    var sDateTimeStr = sDateTime.substring(0, 4) + "/" + sDateTime.substring(4, 6) + "/" + sDateTime.substring(6, 8) + " " +
                        sDateTime.substring(8, 10) + ":" + sDateTime.substring(10, 12) + ":" + sDateTime.substring(12, 14);
                    var iTimezoneOffset = new Date().getTimezoneOffset();
                    var newDate = new Date(new Date(sDateTimeStr).getTime() - iTimezoneOffset * 60 * 1000);
                    if (oResult.SCHEDULEEND) {
                        sType = "Success";
                        sText = this.getModel("i18n").getResourceBundle().getText("MRPSynchronousMsg1", [newDate]);
                    } else {
                        sType = "Warning";
                        sText = this.getModel("i18n").getResourceBundle().getText("MRPSynchronousMsg2", [oResult.SCHEDULEUSER, newDate]);
                        oButton.setEnabled(false);
                    }
                    oMessageStrip.setText(sText);
                    oMessageStrip.setType(sType);
                }.bind(this), function (oError) {
                    this._myBusyDialog.close();
                    MessageBox.error(oError);
                }.bind(this));
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
            var bFromMRPTable = this.getModel("local").getProperty("/filter/FromMRPTable");
            aFilters.push(new Filter("FromMRPTable", FilterOperator.EQ, bFromMRPTable));
            this._CallODataV2("", "READ", "/PODataAnalysis", aFilters, {}, {}).then(function (oResponse) {
                var aResults = [];
                if (oResponse.results[0]) {
                    aResults = JSON.parse(oResponse.results[0].DynamicData);
                }
                if (aResults.length > 0) {
                    this.getModel("local").setProperty("/resultSet", aResults);
                } else {
                    MessageBox.error(this.getModel("i18n").getResourceBundle().getText("NoData"));
                }
            }.bind(this), function (oError) {
                MessageBox.error(oError);
            }.bind(this));
        },

        onExport: function () {
            var oTable = this.byId("idListTable");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("title");
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
                        case "PLANNEDDELIVERYDURATIONINDAYS":
                        case "GOODSRECEIPTDURATIONINDAYS":
                        case "LOTSIZEROUNDINGQUANTITY":
                        case "NETPRICE":
                        case "ORDERQUANTITY":
                        case "PONOKORU":
                        case "CONFIRMEDQUANTITY":
                        case "NETAMOUNT":
                        case "ROUGHGOODSRECEIPTQTY":
                        case "MRPRELEVANTQUANTITY":
                            sType = sap.ui.export.EdmType.String;
                            sTextAlign = "End";
                            break;
                        default:
                            sType = sap.ui.export.EdmType.String;
                            sTextAlign = "Begin";
                            break;
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
        },

        onMRPSynchronous: function () {
            this._myBusyDialog.open();
            this._CallODataV2("MRP", "ACTION", "/ScheduleMRPSynchronous", [], {
                "Event": "",
                "Zzkey": this._UserInfo.getLastName() + " " + this._UserInfo.getFirstName(),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                this._myBusyDialog.close();
                if (oResponse.ScheduleMRPSynchronous.Event === "S") {
                    this.byId("idMRPSynchronous").setEnabled(false);
                    var oResult = JSON.parse(oResponse.ScheduleMRPSynchronous.Zzkey);
                    MessageBox.success(this.getModel("i18n").getResourceBundle().getText("MRPSynchronousMsg3", [oResult.JOBNAME]));
                    var oMessageStrip = this.byId("idMRPSynchronousMsg");
                    var sDateTime = oResult.SCHEDULEBEGIN;
                    var sDateTimeStr = sDateTime.substring(0, 4) + "/" + sDateTime.substring(4, 6) + "/" + sDateTime.substring(6, 8) + " " +
                        sDateTime.substring(8, 10) + ":" + sDateTime.substring(10, 12) + ":" + sDateTime.substring(12, 14);
                    var iTimezoneOffset = new Date().getTimezoneOffset();
                    var newDate = new Date(new Date(sDateTimeStr).getTime() - iTimezoneOffset * 60 * 1000);
                    var sType = "Warning";
                    var sText = this.getModel("i18n").getResourceBundle().getText("MRPSynchronousMsg2", [oResult.SCHEDULEUSER, newDate]);
                    oMessageStrip.setText(sText);
                    oMessageStrip.setType(sType);
                } else {
                    MessageBox.error(oResponse.ScheduleMRPSynchronous.Zzkey);
                }
            }.bind(this), function (oError) {
                this._myBusyDialog.close();
                MessageBox.error(oError);
            }.bind(this));
        }
    });
});