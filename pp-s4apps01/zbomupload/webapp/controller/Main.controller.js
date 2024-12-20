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

    return Base.extend("pp.zbomupload.controller.Main", {

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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-View"),
                        Clear: aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-Clear"),
                        Check: aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-Check"),
                        Excute: aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-Excute"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "zbomupload-Export")
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
                // read valid data starting from line 14
                for (var i = 12; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 11,
                        "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                        "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                        "BillOfMaterialVariantUsage": aSheetData[i]["BillOfMaterialVariantUsage"] === undefined ? "" : aSheetData[i]["BillOfMaterialVariantUsage"],
                        "BillOfMaterialVariant": aSheetData[i]["BillOfMaterialVariant"] === undefined ? "" : aSheetData[i]["BillOfMaterialVariant"],
                        "HeaderValidityStartDate": aSheetData[i]["HeaderValidityStartDate"] === undefined ? "" : this.conversionDate(aSheetData[i]["HeaderValidityStartDate"]),
                        "HeaderValidityStartDate1": aSheetData[i]["HeaderValidityStartDate"] === undefined ? "" : new Date(this.formatDateString(aSheetData[i]["HeaderValidityStartDate"])),
                        "BOMHeaderQuantityInBaseUnit": aSheetData[i]["BOMHeaderQuantityInBaseUnit"] === undefined ? "" : aSheetData[i]["BOMHeaderQuantityInBaseUnit"],
                        "BOMHeaderText": aSheetData[i]["BOMHeaderText"] === undefined ? "" : aSheetData[i]["BOMHeaderText"],
                        "BOMAlternativeText": aSheetData[i]["BOMAlternativeText"] === undefined ? "" : aSheetData[i]["BOMAlternativeText"],
                        "BillOfMaterialStatus": aSheetData[i]["BillOfMaterialStatus"] === undefined ? "" : aSheetData[i]["BillOfMaterialStatus"],
                        "BillOfMaterialItemNumber": aSheetData[i]["BillOfMaterialItemNumber"] === undefined ? "" : aSheetData[i]["BillOfMaterialItemNumber"],
                        "BillOfMaterialItemCategory": aSheetData[i]["BillOfMaterialItemCategory"] === undefined ? "" : aSheetData[i]["BillOfMaterialItemCategory"],
                        "BillOfMaterialComponent": aSheetData[i]["BillOfMaterialComponent"] === undefined ? "" : aSheetData[i]["BillOfMaterialComponent"],
                        "BillOfMaterialItemQuantity": aSheetData[i]["BillOfMaterialItemQuantity"] === undefined ? "" : aSheetData[i]["BillOfMaterialItemQuantity"],
                        "BillOfMaterialItemUnit": aSheetData[i]["BillOfMaterialItemUnit"] === undefined ? "" : aSheetData[i]["BillOfMaterialItemUnit"],
                        "BOMItemSorter": aSheetData[i]["BOMItemSorter"] === undefined ? "" : aSheetData[i]["BOMItemSorter"],
                        "ComponentScrapInPercent": aSheetData[i]["ComponentScrapInPercent"] === undefined ? "" : aSheetData[i]["ComponentScrapInPercent"],
                        "AlternativeItemGroup": aSheetData[i]["AlternativeItemGroup"] === undefined ? "" : aSheetData[i]["AlternativeItemGroup"],
                        "AlternativeItemPriority": aSheetData[i]["AlternativeItemPriority"] === undefined ? "" : aSheetData[i]["AlternativeItemPriority"],
                        "AlternativeItemStrategy": aSheetData[i]["AlternativeItemStrategy"] === undefined ? "" : aSheetData[i]["AlternativeItemStrategy"],
                        "UsageProbabilityPercent": aSheetData[i]["UsageProbabilityPercent"] === undefined ? "" : aSheetData[i]["UsageProbabilityPercent"],
                        "BOMItemDescription": aSheetData[i]["BOMItemDescription"] === undefined ? "" : aSheetData[i]["BOMItemDescription"],
                        "BOMItemText2": aSheetData[i]["BOMItemText2"] === undefined ? "" : aSheetData[i]["BOMItemText2"],
                        "ProdOrderIssueLocation": aSheetData[i]["ProdOrderIssueLocation"] === undefined ? "" : aSheetData[i]["ProdOrderIssueLocation"],
                        "BOMItemIsCostingRelevant": aSheetData[i]["BOMItemIsCostingRelevant"] === undefined ? "" : aSheetData[i]["BOMItemIsCostingRelevant"],
                        "BOMSubItemInstallationPoint": aSheetData[i]["BOMSubItemInstallationPoint"] === undefined ? "" : aSheetData[i]["BOMSubItemInstallationPoint"],
                        "BillOfMaterialSubItemQuantity": aSheetData[i]["BillOfMaterialSubItemQuantity"] === undefined ? "" : aSheetData[i]["BillOfMaterialSubItemQuantity"]
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
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant", "BillOfMaterialVariant"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sMaterial = aGroupKey[m].Material;
                const sPlant = aGroupKey[m].Plant;
                const sBillOfMaterialVariant = aGroupKey[m].BillOfMaterialVariant;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant &&
                        aExcelSet[n].BillOfMaterialVariant === sBillOfMaterialVariant) {
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
                var uploadProcess = this.getModel().bindContext("/BomUpload/com.sap.gateway.srvd.zui_bomupload_o4.v0001.processLogic(...)");
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
