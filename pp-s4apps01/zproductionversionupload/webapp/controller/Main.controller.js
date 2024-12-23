/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Base, formatter, xlsx, BusyDialog, MessageBox, MessageToast) {
    "use strict";

    return Base.extend("pp.zproductionversionupload.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            this._BusyDialog = new BusyDialog();
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-View"),
                        Clear: aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-Clear"),
                        Check: aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-Check"),
                        Excute: aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-Excute"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "zproductionversionupload-Export")
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

        onFileChange: function (oEvent) {
            var aExcelSet = [];
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                this.getModel("local").setProperty("/excelSet", []);
                this.getModel("local").setProperty("/logInfo", "");
                return;
            }
            var oReader = new FileReader();
            oReader.readAsArrayBuffer(oFile);
            this._BusyDialog.open();
            oReader.onload = function (e) {
                var oWorkBook = XLSX.read(e.target.result, {
                    type: "binary"
                });
                var oSheet = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]];
                var aSheetData = XLSX.utils.sheet_to_row_object_array(oSheet);
                // read valid data starting from line 7
                for (var i = 5; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 4,
                        "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                        "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                        "ProductionVersion": aSheetData[i]["ProductionVersion"] === undefined ? "" : aSheetData[i]["ProductionVersion"],
                        "ProductionVersionText": aSheetData[i]["ProductionVersionText"] === undefined ? "" : aSheetData[i]["ProductionVersionText"],
                        "ValidityStartDate": aSheetData[i]["ValidityStartDate"] === undefined ? "" : this.conversionDate(aSheetData[i]["ValidityStartDate"]),
                        "ValidityStartDate1": aSheetData[i]["ValidityStartDate"] === undefined ? "" : new Date(this.formatDateString(aSheetData[i]["ValidityStartDate"])),
                        "ValidityEndDate": aSheetData[i]["ValidityEndDate"] === undefined ? "" : this.conversionDate(aSheetData[i]["ValidityEndDate"]),
                        "ValidityEndDate1": aSheetData[i]["ValidityEndDate"] === undefined ? "" : new Date(this.formatDateString(aSheetData[i]["ValidityEndDate"])),
                        "BillOfOperationsType": aSheetData[i]["BillOfOperationsType"] === undefined ? "" : aSheetData[i]["BillOfOperationsType"],
                        "BillOfOperationsGroup": aSheetData[i]["BillOfOperationsGroup"] === undefined ? "" : aSheetData[i]["BillOfOperationsGroup"],
                        "BillOfOperationsVariant": aSheetData[i]["BillOfOperationsVariant"] === undefined ? "" : aSheetData[i]["BillOfOperationsVariant"],
                        "BillOfMaterialVariantUsage": aSheetData[i]["BillOfMaterialVariantUsage"] === undefined ? "" : aSheetData[i]["BillOfMaterialVariantUsage"],
                        "BillOfMaterialVariant": aSheetData[i]["BillOfMaterialVariant"] === undefined ? "" : aSheetData[i]["BillOfMaterialVariant"],
                        "ProductionLine": aSheetData[i]["ProductionLine"] === undefined ? "" : aSheetData[i]["ProductionLine"],
                        "IssuingStorageLocation": aSheetData[i]["IssuingStorageLocation"] === undefined ? "" : aSheetData[i]["IssuingStorageLocation"],
                        "ReceivingStorageLocation": aSheetData[i]["ReceivingStorageLocation"] === undefined ? "" : aSheetData[i]["ReceivingStorageLocation"]
                    };
                    aExcelSet.push(item);
                }
                this.getModel("local").setProperty("/excelSet", aExcelSet);
                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, 0, 0]));
                this.byId("idFileUploader").clear();
                this._BusyDialog.close();
            }.bind(this);
        },

        onClear: function () {
            this.getModel("local").setProperty("/excelSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },

        onCheck: function () {
            this._callOData("CHECK");
        },

        onExcute: function () {
            this._callOData("EXCUTE");
        },

        onExport: function () {
            this._callOData("EXPORT");
        },

        _callOData: function (bEvent) {
            var aPromise = [];
            var aExcelSet = this.getModel("local").getProperty("/excelSet");
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant", "ProductionVersion"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sMaterial = aGroupKey[m].Material;
                const sPlant = aGroupKey[m].Plant;
                const sProductionVersion = aGroupKey[m].ProductionVersion;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant && aExcelSet[n].ProductionVersion === sProductionVersion) {
                        aGroupItems.push(aExcelSet[n]);
                    }
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems));
            }
            try {
                this._BusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    var oResult = {
                        iSuccess: 0,
                        iFailed: 0
                    };
                    this._BusyDialog.close();
                    var aExcelSet = this.getModel("local").getProperty("/excelSet");
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        if (bEvent === "EXPORT") {
                            if (object.RecordUUID) {
                                var sURL = this.getModel("Print").getServiceUrl() + "PrintRecord(RecordUUID=" + object.RecordUUID + ",IsActiveEntity=true)/PDFContent";
                                sap.m.URLHelper.redirect(sURL, true);
                            }
                        } else {
                            JSON.parse(object.Zzkey).forEach(element => {
                                for (var index = 0; index < aExcelSet.length; index++) {
                                    if (aExcelSet[index].Row === element.ROW) {
                                        aExcelSet[index].Status = element.STATUS;
                                        aExcelSet[index].Message = element.MESSAGE;
                                    }
                                }
                                if (element.STATUS === 'E') {
                                    oResult.iFailed += 1;
                                } else {
                                    oResult.iSuccess += 1;
                                }
                            });
                        }
                    }
                    this.getModel("local").setProperty("/excelSet", aExcelSet);
                    this.getModel("local").setProperty("/logInfo", this.getModel("i18n").getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                    MessageToast.show(this.getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    this._BusyDialog.close();
                });
            } catch (error) {
                MessageBox.error(error);
                this._BusyDialog.close();
            }
        },

        _callODataAction: function (bEvent, aRequestData) {
            return new Promise((resolve, reject) => {
                var uploadProcess = this.getModel().bindContext("/ProductionVersion/com.sap.gateway.srvd.zui_productionversion_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.setParameter("RecordUUID", '');
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });
});
