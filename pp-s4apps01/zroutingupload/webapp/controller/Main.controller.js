/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox"
], function (Base, formatter, xlsx, BusyDialog, MessageBox) {
    "use strict";

    return Base.extend("pp.zroutingupload.controller.Main", {

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
                        "Product": aSheetData[i]["Product"],
                        "Plant": aSheetData[i]["Plant"],
                        "ValidityStartDate": aSheetData[i]["ValidityStartDate"],
                        "BillOfOperationsDesc": aSheetData[i]["BillOfOperationsDesc"],
                        "BillOfOperationsUsage": aSheetData[i]["BillOfOperationsUsage"],
                        "BillOfOperationsStatus": aSheetData[i]["BillOfOperationsStatus"],
                        "ResponsiblePlannerGroup": aSheetData[i]["ResponsiblePlannerGroup"],
                        "Operation": aSheetData[i]["Operation"],
                        "WorkCenterInternalID": aSheetData[i]["WorkCenterInternalID"],
                        "OperationControlProfile": aSheetData[i]["OperationControlProfile"],
                        "OperationStandardTextCode": aSheetData[i]["OperationStandardTextCode"],
                        "StandardWorkQuantity1": aSheetData[i]["StandardWorkQuantity1"],
                        "StandardWorkQuantityUnit1": aSheetData[i]["StandardWorkQuantityUnit1"],
                        "StandardWorkQuantity2": aSheetData[i]["StandardWorkQuantity2"],
                        "StandardWorkQuantityUnit2": aSheetData[i]["StandardWorkQuantityUnit2"],
                        "StandardWorkQuantity3": aSheetData[i]["StandardWorkQuantity3"],
                        "StandardWorkQuantityUnit3": aSheetData[i]["StandardWorkQuantityUnit3"],
                        "StandardWorkQuantity4": aSheetData[i]["StandardWorkQuantity4"],
                        "StandardWorkQuantityUnit4": aSheetData[i]["StandardWorkQuantityUnit4"],
                        "StandardWorkQuantity5": aSheetData[i]["StandardWorkQuantity5"],
                        "StandardWorkQuantityUnit5": aSheetData[i]["StandardWorkQuantityUnit5"],
                        "StandardWorkQuantity6": aSheetData[i]["StandardWorkQuantity6"],
                        "StandardWorkQuantityUnit6": aSheetData[i]["StandardWorkQuantityUnit6"],
                        "NumberOfTimeTickets": aSheetData[i]["NumberOfTimeTickets"]
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
                        JSON.parse(object.Zzkey).forEach(element => {
                            for (var index = 0; index < aExcelSet.length; index++) {
                                if (aExcelSet[index].Row === element.ROW) {
                                    aExcelSet[index].Status = element.STATUS;
                                    aExcelSet[index].Message = element.MESSAGE;
                                }
                            }
                        });
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
                var uploadProcess = this.getModel().bindContext("/RoutingUpload/com.sap.gateway.srvd.zui_routingupload_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });
});
