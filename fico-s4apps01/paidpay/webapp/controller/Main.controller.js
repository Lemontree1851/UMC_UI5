sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
],
    function (Base, formatter, xlsx, BusyDialog, MessageBox, Spreadsheet) {
        "use strict";

        return Base.extend("fico.paidpay.controller.Main", {
            onInit: function () {

                //this.getOwnerComponent().getModel("local").setProperty("/paidPay1", true);
                this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
            },

            _initialize: function () {
                this._BusyDialog = new BusyDialog();
                // bind attachment path

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
                    // read valid data starting from line 2
                    for (var i = 2; i < aSheetData.length; i++) {
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i - 1,
                            "CompanyCode": aSheetData[i]["CompanyCode"],  //会社コード
                            "FiscalYear": aSheetData[i]["FiscalYear"],   //会計年度
                            "Period": aSheetData[i]["Period"],       //会計期間
                            "ProfitCenter": aSheetData[i]["ProfitCenter"], //利益センタ
                            "BusinessPartner": aSheetData[i]["BusinessPartner"], //得意先コード
                            "PurchasingGroup": aSheetData[i]["PurchasingGroup"], //購買グループ
                            "PreStockAmt": aSheetData[i]["PreviousStockAmount"], //前期末在庫金額
                            "BegPurGrpAmt": aSheetData[i]["BeginningPurchasingGroupAmount"], //期首購買グループ仕入れ金額
                            "BegChgMaterialAmt": aSheetData[i]["BeginningChargeableMaterialAmount"], //期首有償支給品仕入れ金額
                            "BegCustomerRev": aSheetData[i]["BeginningCustomerRevenue"],    //期首得意先の総売上高
                            "BegRev": aSheetData[i]["BeginningRevenue"] //期首会社レベルの総売上高
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

            _callOData: function (bEvent) {
                var aPromise = [];
                var aExcelSet = this.getModel("local").getProperty("/excelSet");
                var aGroupItems = [];
                var sRadio = "";
                if (this.getModel("local").getProperty("/paidPay1")){
                    sRadio = '1';
                } else{
                    sRadio = '2';
                }
                for (var n = 0; n < aExcelSet.length; n++) {
                    aGroupItems.push(aExcelSet[n]);
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems, sRadio));

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
                            if (bEvent === "CHECK") {
                                JSON.parse(object.Zzkey).forEach(element => {
                                    for (var index = 0; index < aExcelSet.length; index++) {
                                        if (aExcelSet[index].Row === element.ROW) {
                                            aExcelSet[index].Status = element.STATUS;
                                            aExcelSet[index].Message = element.MESSAGE;

                                            if (element.STATUS = 'S') {
                                                oResult.iSuccess += 1;
                                            } else {
                                                oResult.iFailed += 1;
                                            }
                                        }
                                    }
                                });
                                this.getModel("local").setProperty("/excelSet", aExcelSet);
                                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                            } else {
                                JSON.parse(object.Zzkey).forEach(element => {
                                    for (var index = 0; index < aExcelSet.length; index++) {
                                        if (aExcelSet[index].Row === element.ROW) {
                                            if (element.STATUS === 'S') {
                                                MessageBox.success(element.Message);
                                            } else {
                                                MessageBox.error(element.Message);
                                            }
                                        }
                                        break;
                                    }
                                });
                            }
                        }
                    }).catch((error) => {
                        MessageBox.error(error.message);
                    }).finally(() => {
                        this._BusyDialog.close();
                    });
                } catch (error) {
                    MessageBox.error(error.message);
                    this._BusyDialog.close();
                }
            },

            _callODataAction: function (bEvent, aRequestData, sRadio) {
                return new Promise((resolve, reject) => {
                    var uploadProcess = this.getModel().bindContext("/PaidPay/com.sap.gateway.srvd.zui_paidpay_o4.v0001.processLogic(...)");
                    uploadProcess.setParameter("Event", bEvent);
                    uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                    uploadProcess.setParameter("UploadType", sRadio);
                    uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        resolve(uploadProcess);
                    }).catch((error) => {
                        reject(error.message);
                    });
                });
            }


        });
    });