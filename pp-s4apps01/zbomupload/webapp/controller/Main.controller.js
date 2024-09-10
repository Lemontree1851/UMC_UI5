/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox"
], function (Base, formatter, xlsx, BusyDialog, MessageBox) {
    "use strict";

    return Base.extend("pp.zbomupload.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            this._BusyDialog = new BusyDialog();
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
                // read valid data starting from line 3 
                for (var i = 3; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 2,
                        "Material": aSheetData[i]["Material"],
                        "Plant": aSheetData[i]["Plant"],
                        "BillOfMaterialVariantUsage": aSheetData[i]["BillOfMaterialVariantUsage"],
                        "IsMultipleBOMAlt": aSheetData[i]["IsMultipleBOMAlt"],
                        "HeaderValidityStartDate": new Date(aSheetData[i]["HeaderValidityStartDate"]),
                        "BOMHeaderQuantityInBaseUnit": aSheetData[i]["BOMHeaderQuantityInBaseUnit"],
                        "BOMHeaderText": aSheetData[i]["BOMHeaderText"],
                        "BOMAlternativeText": aSheetData[i]["BOMAlternativeText"],
                        "BillOfMaterialStatus": aSheetData[i]["BillOfMaterialStatus"],
                        "BillOfMaterialItemNumber": aSheetData[i]["BillOfMaterialItemNumber"],
                        "BillOfMaterialItemCategory": aSheetData[i]["BillOfMaterialItemCategory"],
                        "BillOfMaterialComponent": aSheetData[i]["BillOfMaterialComponent"],
                        "BillOfMaterialItemQuantity": aSheetData[i]["BillOfMaterialItemQuantity"],
                        "BillOfMaterialItemUnit": aSheetData[i]["BillOfMaterialItemUnit"],
                        "BOMItemSorter": aSheetData[i]["BOMItemSorter"],
                        "ComponentScrapInPercent": aSheetData[i]["ComponentScrapInPercent"],
                        "AlternativeItemGroup": aSheetData[i]["AlternativeItemGroup"],
                        "AlternativeItemPriority": aSheetData[i]["AlternativeItemPriority"],
                        "AlternativeItemStrategy": aSheetData[i]["AlternativeItemStrategy"],
                        "UsageProbabilityPercent": aSheetData[i]["UsageProbabilityPercent"],
                        "BOMItemDescription": aSheetData[i]["BOMItemDescription"],
                        "BOMItemText2": aSheetData[i]["BOMItemText2"],
                        "ProdOrderIssueLocation": aSheetData[i]["ProdOrderIssueLocation"],
                        "BOMItemIsCostingRelevant": aSheetData[i]["BOMItemIsCostingRelevant"],
                        "BOMSubItemInstallationPoint": aSheetData[i]["BOMSubItemInstallationPoint"],
                        "BillOfMaterialSubItemQuantity": aSheetData[i]["BillOfMaterialSubItemQuantity"]
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
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sMaterial = aGroupKey[m].Material;
                const sPlant = aGroupKey[m].Plant;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant) {
                        aGroupItems.push(aExcelSet[n]);
                    }
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems));
            }
            try {
                this._BusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
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
                            });
                        }
                    }
                    this.getModel("local").setProperty("/excelSet", aExcelSet);
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
