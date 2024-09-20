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

    return Base.extend("pp.zorderforecastupload.controller.Main", {

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
            var sFileName = oFile.name;
            oReader.readAsArrayBuffer(oFile);
            this._BusyDialog.open();
            oReader.onload = function (e) {
                var oWorkBook = XLSX.read(e.target.result, {
                    type: "binary"
                });
                var oSheet = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]];
                var aSheetData = XLSX.utils.sheet_to_row_object_array(oSheet);
                if (sFileName.includes("横")) {
                    // read valid data starting from line 7
                    for (var i = 5; i < aSheetData.length; i++) {
                        debugger;
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i - 2,
                            "Customer": aSheetData[i]["Customer"] === undefined ? "" : aSheetData[i]["Customer"],
                            "MaterialByCustomer": aSheetData[i]["MaterialByCustomer"] === undefined ? "" : aSheetData[i]["MaterialByCustomer"],
                            "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                            "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                            "RequirementDate": "",
                            "RequirementDate1": "",
                            "RequirementQty": "",
                            "Remark": "",
                            "MaterialStr": ""
                        };
                        for (const key in aSheetData[i]) {
                            if (key.includes("EMPTY")) {
                                var row = this._deepClone(item);
                                row.RequirementQty = aSheetData[i][key];
                                row.RequirementDate = aSheetData[1][key] === undefined ? "" : this.conversionDate(aSheetData[1][key]);
                                row.RequirementDate1 = aSheetData[1][key] === undefined ? "" : new Date(aSheetData[1][key]);
                                row.MaterialStr = row.MaterialByCustomer + row.Material;
                                aExcelSet.push(row);
                            }
                        }
                    }
                } else if (sFileName.includes("縦")) {
                    for (var i = 5; i < aSheetData.length; i++) {
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i - 2,
                            "Customer": aSheetData[i]["Customer"] === undefined ? "" : aSheetData[i]["Customer"],
                            "MaterialByCustomer": aSheetData[i]["MaterialByCustomer"] === undefined ? "" : aSheetData[i]["MaterialByCustomer"],
                            "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                            "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                            "RequirementDate": aSheetData[i]["RequirementDate"] === undefined ? "" : this.conversionDate(aSheetData[i]["RequirementDate"]),
                            "RequirementDate1": aSheetData[i]["RequirementDate"] === undefined ? "" : new Date(aSheetData[i]["RequirementDate"]),
                            "RequirementQty": aSheetData[i]["RequirementQty"] === undefined ? "" : aSheetData[i]["RequirementQty"],
                            "Remark": aSheetData[i]["Remark"] === undefined ? "" : aSheetData[i]["Remark"],
                            "MaterialStr": ""
                        };
                        var row = this._deepClone(item);
                        row.MaterialStr = row.MaterialByCustomer + row.Material;
                        aExcelSet.push(row);
                    }
                } else {
                    MessageBox.error(this.getResourceBundle().getText("InvalidFileName"));
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
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Customer", "MaterialStr", "Plant"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sCustomer = aGroupKey[m].Customer;
                const sMaterialStr = aGroupKey[m].MaterialStr;
                const sPlant = aGroupKey[m].Plant;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Customer === sCustomer && aExcelSet[n].MaterialStr === sMaterialStr && aExcelSet[n].Plant === sPlant) {
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
                                        aExcelSet[index].RequirementDate1 = new Date(element.REQUIREMENTDATE);
                                    }
                                }
                                if (element.STATUS === 'S') {
                                    oResult.iSuccess += 1;
                                } else {
                                    oResult.iFailed += 1;
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
                var uploadProcess = this.getModel().bindContext("/ZC_ORDERFORECAST/com.sap.gateway.srvd.zui_orderforecast_o4.v0001.processLogic(...)");
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
