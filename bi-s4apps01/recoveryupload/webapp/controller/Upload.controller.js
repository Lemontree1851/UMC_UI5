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

    return Base.extend("bi.recoveryupload.controller.Upload", {

        formatter: formatter,

        onInit() {
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
            var iBtnIndex = this.byId("idRBGUpload").getSelectedIndex();
            oReader.onload = function (e) {
                var oWorkBook = XLSX.read(e.target.result, {
                    type: "binary"
                });
                var oSheet = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]];
                var aSheetData = XLSX.utils.sheet_to_row_object_array(oSheet);
                // read valid data starting from line 4
                for (var i = 2; i < aSheetData.length; i++) {
                    var item;
                    switch (iBtnIndex) {
                        // SB スポットバイ
                        case 0:
                            item = {
                                "Status": "",
                                "Message": "",
                                "Row": i - 1,
                                "YearMonth": aSheetData[i]["YearMonth"] === undefined ? "" : aSheetData[i]["YearMonth"],
                                "RecoveryManagementNumber": aSheetData[i]["RecoveryManagementNumber"] === undefined ? "" : aSheetData[i]["RecoveryManagementNumber"],
                                "PurchaseOrder": aSheetData[i]["PurchaseOrder"] === undefined ? "" : aSheetData[i]["PurchaseOrder"],
                                "PurchaseOrderItem": aSheetData[i]["PurchaseOrderItem"] === undefined ? "" : aSheetData[i]["PurchaseOrderItem"],
                                "SpotbuyMaterial": aSheetData[i]["SpotbuyMaterial"] === undefined ? "" : aSheetData[i]["SpotbuyMaterial"],
                                "SpotbuyMaterialText": aSheetData[i]["SpotbuyMaterialText"] === undefined ? "" : aSheetData[i]["SpotbuyMaterialText"],
                                "SpotbuyMaterialPrice": aSheetData[i]["SpotbuyMaterialPrice"] === undefined ? "" : aSheetData[i]["SpotbuyMaterialPrice"],
                                "GeneralMaterial": aSheetData[i]["GeneralMaterial"] === undefined ? "" : aSheetData[i]["GeneralMaterial"],
                                "GeneralMaterialText": aSheetData[i]["GeneralMaterialText"] === undefined ? "" : aSheetData[i]["GeneralMaterialText"],
                                "GeneralMaterialPrice": aSheetData[i]["GeneralMaterialPrice"] === undefined ? "" : aSheetData[i]["GeneralMaterialPrice"],
                                "MaterialQuantity": aSheetData[i]["MaterialQuantity"] === undefined ? "" : aSheetData[i]["MaterialQuantity"]
                            };
                            break;
                        // IN イニシャル
                        case 1:
                            item = {
                                "Status": "",
                                "Message": "",
                                "Row": i - 1,
                                "YearMonth": aSheetData[i]["YearMonth"] === undefined ? "" : aSheetData[i]["YearMonth"],
                                "RecoveryManagementNumber": aSheetData[i]["RecoveryManagementNumber"] === undefined ? "" : aSheetData[i]["RecoveryManagementNumber"],
                                "PurchaseOrder": aSheetData[i]["PurchaseOrder"] === undefined ? "" : aSheetData[i]["PurchaseOrder"],
                                "PurchaseOrderItem": aSheetData[i]["PurchaseOrderItem"] === undefined ? "" : aSheetData[i]["PurchaseOrderItem"],
                                "InitialMaterial": aSheetData[i]["InitialMaterial"] === undefined ? "" : aSheetData[i]["InitialMaterial"],
                                "InitialMaterialText": aSheetData[i]["InitialMaterialText"] === undefined ? "" : aSheetData[i]["InitialMaterialText"],
                                "MateriaGroup": aSheetData[i]["MateriaGroup"] === undefined ? "" : aSheetData[i]["MateriaGroup"],
                                "AccountingDocument": aSheetData[i]["AccountingDocument"] === undefined ? "" : aSheetData[i]["AccountingDocument"],
                                "AccountingDocumentItem": aSheetData[i]["AccountingDocumentItem"] === undefined ? "" : aSheetData[i]["AccountingDocumentItem"],
                                "GLAccount": aSheetData[i]["GLAccount"] === undefined ? "" : aSheetData[i]["GLAccount"],
                                "GLAccountText": aSheetData[i]["GLAccountText"] === undefined ? "" : aSheetData[i]["GLAccountText"],
                                "FixedAsset": aSheetData[i]["FixedAsset"] === undefined ? "" : aSheetData[i]["FixedAsset"],
                                "FixedAssetText": aSheetData[i]["FixedAssetText"] === undefined ? "" : aSheetData[i]["FixedAssetText"],
                                "POQuantity": aSheetData[i]["POQuantity"] === undefined ? "" : aSheetData[i]["POQuantity"],
                                "NetAmount": aSheetData[i]["NetAmount"] === undefined ? "" : aSheetData[i]["NetAmount"],
                                "RecoveryNecessaryAmount": aSheetData[i]["RecoveryNecessaryAmount"] === undefined ? "" : aSheetData[i]["RecoveryNecessaryAmount"]
                            };
                            break;
                        // ST 特別輸送費
                        case 2:
                            item = {
                                "Status": "",
                                "Message": "",
                                "Row": i - 1,
                                "YearMonth": aSheetData[i]["YearMonth"] === undefined ? "" : aSheetData[i]["YearMonth"],
                                "RecoveryManagementNumber": aSheetData[i]["RecoveryManagementNumber"] === undefined ? "" : aSheetData[i]["RecoveryManagementNumber"],
                                "PurchaseOrder": aSheetData[i]["PurchaseOrder"] === undefined ? "" : aSheetData[i]["PurchaseOrder"],
                                "PurchaseOrderItem": aSheetData[i]["PurchaseOrderItem"] === undefined ? "" : aSheetData[i]["PurchaseOrderItem"],
                                "TransportExpenseMaterial": aSheetData[i]["TransportExpenseMaterial"] === undefined ? "" : aSheetData[i]["TransportExpenseMaterial"],
                                "TransportExpenseMaterialText": aSheetData[i]["TransportExpenseMaterialText"] === undefined ? "" : aSheetData[i]["TransportExpenseMaterialText"],
                                "POQuantity": aSheetData[i]["POQuantity"] === undefined ? "" : aSheetData[i]["POQuantity"],
                                "NetAmount": aSheetData[i]["NetAmount"] === undefined ? "" : aSheetData[i]["NetAmount"],
                                "RecoveryNecessaryAmount": aSheetData[i]["RecoveryNecessaryAmount"] === undefined ? "" : aSheetData[i]["RecoveryNecessaryAmount"]
                            };
                            break;
                        // SS 在庫廃棄ロス
                        case 3:
                            item = {
                                "Status": "",
                                "Message": "",
                                "Row": i - 1,
                                "YearMonth": aSheetData[i]["YearMonth"] === undefined ? "" : aSheetData[i]["YearMonth"],
                                "RecoveryManagementNumber": aSheetData[i]["RecoveryManagementNumber"] === undefined ? "" : aSheetData[i]["RecoveryManagementNumber"],
                                "MaterialDocument": aSheetData[i]["MaterialDocument"] === undefined ? "" : aSheetData[i]["MaterialDocument"],
                                "MaterialDocumentItem": aSheetData[i]["MaterialDocumentItem"] === undefined ? "" : aSheetData[i]["MaterialDocumentItem"],
                                "SSMaterial": aSheetData[i]["SSMaterial"] === undefined ? "" : aSheetData[i]["SSMaterial"],
                                "SSMaterialText": aSheetData[i]["SSMaterialText"] === undefined ? "" : aSheetData[i]["SSMaterialText"],
                                "GLAccount": aSheetData[i]["GLAccount"] === undefined ? "" : aSheetData[i]["GLAccount"],
                                "GLAccountText": aSheetData[i]["GLAccountText"] === undefined ? "" : aSheetData[i]["GLAccountText"],
                                "Quantity": aSheetData[i]["Quantity"] === undefined ? "" : aSheetData[i]["Quantity"],
                                "Amount": aSheetData[i]["Amount"] === undefined ? "" : aSheetData[i]["Amount"]
                            };
                            break;
                        default:
                            break;
                    }
                    aExcelSet.push(item);
                }
                this.getModel("local").setProperty("/excelSet", aExcelSet);
                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, 0, 0]));
                this.byId("idFileUploader").clear();
                this._BusyDialog.close();
            }.bind(this);
        },

        onSave: function () {
            this._callOData("SAVE");
        },

        onExport: function () {
            this._callOData("EXPORT");
        },

        _callOData: function (bEvent) {
            var aPromise = [];
            var sUploadType = "";
            var aExcelSet = this.getModel("local").getProperty("/excelSet");
            var iBtnIndex = this.byId("idRBGUpload").getSelectedIndex();
            switch (iBtnIndex) {
                case 0:
                    sUploadType = "SB"; // スポットバイ
                    break;
                case 1:
                    sUploadType = "IN"; // イニシャル
                    break;
                case 2:
                    sUploadType = "ST"; // 特別輸送費
                    break;
                case 3:
                    sUploadType = "SS"; // 在庫廃棄ロス
                    break;
                default:
                    break;
            }
            var oRequestData = {
                UploadType: sUploadType,
                JsonData: aExcelSet
            };
            aPromise.push(this._callODataAction(bEvent, oRequestData));
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

        _callODataAction: function (bEvent, oRequestData) {
            return new Promise((resolve, reject) => {
                var uploadProcess = this.getModel().bindContext("/BI003Upload/com.sap.gateway.srvd.zui_bi003_upload_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(oRequestData));
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