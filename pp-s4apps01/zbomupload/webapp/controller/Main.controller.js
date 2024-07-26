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
            // bind attachment path
            var sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='" + "INF" +
                "',DocumentInfoRecordDocNumber='" + "SALESDIFFPROCESS" + "',DocumentInfoRecordDocVersion='" +
                "00" + "',DocumentInfoRecordDocPart='" + "000" + "')";
            this.byId("idTemplateCollection").bindElement(sPath);
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
                        "HeaderValidityStartDate": aSheetData[i]["HeaderValidityStartDate"],
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
            this._callOData(false);
        },

        onExcute: function () {
            this._callOData(true);
        },

        onExport: function () {

        },

        _callOData: function (bTestRun) {
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
                aPromise.push(this._callODataAction(aGroupItems, bTestRun));
            }
            try {
                this._BusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    this._BusyDialog.close();
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                    }
                }).catch((error) => {
                    debugger;
                }).finally(() => {
                    this._BusyDialog.close();
                });
            } catch (error) {
                MessageBox.error(error);
                this._BusyDialog.close();
            }
        },

        _callODataAction: function (aData, bTestRun) {
            var requestData = {
                TestRun: bTestRun,
                data: aData
            };
            return new Promise((resolve, reject) => {
                var uploadProcess = this.getModel().bindContext("/BomUpload/com.sap.gateway.srvd.zui_bomupload_o4.v0001.uploadProcess(...)");
                uploadProcess.setParameter("Zzkey", JSON.stringify(requestData));
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });
});
