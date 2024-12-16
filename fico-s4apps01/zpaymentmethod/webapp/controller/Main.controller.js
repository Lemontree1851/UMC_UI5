/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/model/type/Integer",
    "sap/ui/model/type/String",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/Boolean",
    "sap/ui/model/odata/type/Date",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",

    "sap/m/Token",
    "sap/ui/core/library",
    "sap/ui/core/date/UI5Date",
    "../model/formatter1",
    "sap/m/Token"
], function (Base, formatter, xlsx, BusyDialog, MessageBox, JSONModel, CoreLibrary, UI5Date, Token) {
    "use strict";
    var ValueState = CoreLibrary.ValueState;
    return Base.extend("fico.zpaymentmethod.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
            this.getOwnerComponent().getModel("local").setProperty("/headSet", {});
            // 设置默认日期范围
            var oDateRangeSelection = this.getView().byId("idReceiver");
            //oDateRangeSelection.setDateValue(new Date(2023, 0, 1)); // Start Date: January 1, 2023
            //oDateRangeSelection.setSecondDateValue(new Date(2023, 11, 31)); // End Date: December 31, 2023
            // Get the current date
            var currentDate = new Date();
            // Calculate the first day of the previous month
            var firstDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            // Calculate the last day of the previous month
            var lastDayOfPreviousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            var oDateRangeSelection = this.getView().byId("idReceiver");
            oDateRangeSelection.setDateValue(firstDayOfPreviousMonth); // First day of the previous month
            oDateRangeSelection.setSecondDateValue(lastDayOfPreviousMonth); // Last day of the previous month
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

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

                // read valid data starting from line 2 
                for (var i = 2; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 2,


                        "Plant": aSheetData[i]["Plant"],
                        "Material": aSheetData[i]["Material"],
                        "Age": aSheetData[i]["Age"],
                        "Qty": aSheetData[i]["Qty"],
                        "CalendarYear": aSheetData[i]["CalendarYear"],
                        "CalendarMonth": aSheetData[i]["CalendarMonth"],
                    };
                    aExcelSet.push(item);
                }
                this.getModel("local").setProperty("/excelSet", aExcelSet);
                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, 0, 0]));
                this.byId("idFileUploader").clear();
                this._BusyDialog.close();
            }.bind(this);
        },
        onSearch1: function () {

            var aExcelSet = [];
            var aPromise = [];

            var header = this.getModel("local").gesearchtProperty("/headSet");
            var aPLANT = this.getModel("local").getProperty("/headSet/Plant");
            var aCompanyCode = this.getModel("local").getProperty("/headSet/CompanyCode");

            var aGroupItems;
            aGroupItems = [];
            aGroupItems.push(aPLANT);

            aPromise.push(this._callODataAction("SEARCH", aGroupItems));

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
        onSearch: function () {
            setTimeout(() => {
                this._callOData1("SEARCH");
            }, 1000);
        },
        onClear: function () {
            this.getModel("local").setProperty("/excelSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },
        onExport: function () {
            this._callOData1("EXPORT");
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
        onJob: function () {
            this._callOData("JOB");
        },
        _callOData: function (bEvent) {

            var aSelectedIndices = this.byId("idTable").getSelectedIndices();;
            var aGroupItems;
            var aPromise = [];
            var aExcelSet = this.getModel("local").getProperty("/excelSet");
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant"]);
            var aGroupItems;

            aGroupItems = [];
            aSelectedIndices.forEach(function (iIndex) {
                var num = iIndex;
                aGroupItems.push(aExcelSet[num]);
            });
 
			if (aSelectedIndices.length === 0) {
				MessageBox.error(this._ResourceBundle.getText("msgNoSelect"));
				return;
			}
            aPromise.push(this._callODataAction(bEvent, aGroupItems));

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
                                    if (aExcelSet[index].CompanyCode === element.COMPANYCODE
                                        && aExcelSet[index].LastDate === element.LASTDATE
                                        && aExcelSet[index].Supplier === element.SUPPLIER
                                        && aExcelSet[index].NetdueDate === element.NETDUEDATE
                                        && aExcelSet[index].PaymentMethod === element.PAYMENTMETHOD
                                        && aExcelSet[index].PaymentTerms === element.PAYMENTTERMS
                                    ) {
                                        aExcelSet[index].Status = element.STATUS;
                                        aExcelSet[index].Message = element.MESSAGE;
                                        // aExcelSet[index].ConditionDate = element.CONDITIONDATE;
                                        // aExcelSet[index].PaymentMethod_a = element.PAYMENTMETHOD_A;

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
        _callOData1: function (bEvent) {
 
            var aPromise = [];
            var aGroupItems;
            aGroupItems = [];
  
            var valueStateCompanyCode = this.getView().byId("idCompanyCode").getValueState();
            if (valueStateCompanyCode === "Error") {
                MessageBox.error(this._ResourceBundle.getText("msgFilterError")); 
                return; 
            }
            var valueStateCustomer = this.getView().byId("idCustomer").getValueState();
            if (valueStateCustomer === "Error") {
                MessageBox.error(this._ResourceBundle.getText("msgFilterError")); 
                return; 
            }
            var valuePaymentMethod = this.getView().byId("idPaymentMethod").getValueState();
            if (valuePaymentMethod === "Error") {
                MessageBox.error(this._ResourceBundle.getText("msgFilterError")); 
                return; 
            }

            var aTokens = this.getView().byId("idCompanyCode").getTokens();
            var afilterSet = [];
            for (var i = 0; i < aTokens.length; i++) {
                var filterItems = {
                    "NAME": "CompanyCode",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW": aTokens[i].getProperty("key"),
                    "HIGH": ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
            }
            console.log("3333",aTokens);
            if (!aTokens[0]) {
                MessageBox.error("必須項目を入力ください");
                return;
            }

            var aTokens = this.getView().byId("idCustomer").getTokens();
            var afilterSet = [];
            var i2 = 0;
            for (var i = 0; i < aTokens.length; i++) {
                if (aTokens[i].getProperty("key").includes("range")) {
                    var tokenText = aTokens[i].getProperty("text")
                    if (tokenText.startsWith("!(=")) {
                        //NOT EQUAL TO
                        var match = tokenText.match(/=\s*(\d+)/);
                        if (match && match[1]) {
                            var extracted = match[1]; 
                            var filterItems = {
                                "NAME": "Customer",
                                "SIGN": "E",
                                "OPTION": "EQ",
                                "LOW": extracted,
                                "HIGH": ""
                            };
                        }
                    }else if (tokenText == "!(<empty>)"){
                        //NOT EMPTY
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "E",
                            "OPTION": "EQ",
                            "LOW": "",
                            "HIGH": ""
                        };
                    } else if (tokenText == "<empty>"){
                        //EMPTY
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "EQ",
                            "LOW": "",
                            "HIGH": ""
                        };
                    } else if (tokenText.includes("*")){
                        //CONTAINS & STARTS WITH & END WITH
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "CP",
                            "LOW": tokenText,
                            "HIGH": ""
                        };
                    } else if (tokenText.startsWith("=")){
                        //EQUAL TO
                        var extractedValue = tokenText.replace("=", "").trim();
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "EQ",
                            "LOW": extractedValue,
                            "HIGH": ""
                        };
                    } else if (tokenText.startsWith("<=")){
                        //LESS EQUAL TO
                        extractedValue = tokenText.replace("<=", "").trim();
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "LE",
                            "LOW": extractedValue,
                            "HIGH": ""
                        };
                    } else if (tokenText.startsWith("<")){
                        //LESS THAN
                        extractedValue = tokenText.replace("<", "").trim();
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "LT",
                            "LOW": extractedValue,
                            "HIGH": ""
                        };
                    } else if (tokenText.startsWith(">=")){
                        //GREATER EQUAL TO
                        extractedValue = tokenText.replace(">=", "").trim();
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "GE",
                            "LOW": extractedValue,
                            "HIGH": ""
                        };
                    } else if (tokenText.startsWith(">")){
                        //GREATER THAN
                        extractedValue = tokenText.replace(">", "").trim();
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "GT",
                            "LOW": extractedValue,
                            "HIGH": ""
                        };
                    }  else if (tokenText.includes("...")){
                        //BETWEEN
                        var rangeParts = aTokens[i].getProperty("text").split('...'); // Split the range text by "..."
                        filterItems = {
                            "NAME": "Customer",
                            "SIGN": "I",
                            "OPTION": "BT",
                            "LOW": rangeParts[0],
                            "HIGH":rangeParts[1]
                        };
                    }  
                } else {
                    filterItems = {
                        "NAME": "Customer",
                        "SIGN": "I",
                        "OPTION": "EQ",
                        "LOW": aTokens[i].getProperty("key"),
                        "HIGH": ""
                    };
                }
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
                var i2 = i;
            }
            var aTokens = this.getView().byId("idPaymentMethod").getTokens();
            var afilterSet = [];
            for (var i = 0; i < aTokens.length; i++) {
                var filterItems = {
                    "NAME": "PaymentMethod",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW": aTokens[i].getProperty("key"),
                    "HIGH": ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
            }
            //var aTokens = this.getView().byId("idReceiver").getTokens();
            var afilterSet = [];

            var filterItems = {
                "NAME": "Receiver",
                "SIGN": "I",
                "OPTION": "EQ",
                "LOW": this.getView().byId("idReceiver")._lastValue,
                "HIGH": ""
            };
            afilterSet.push(filterItems);
            aGroupItems.push(afilterSet[0]);

            if (!this.getView().byId("idReceiver")._lastValue) {
                MessageBox.error("必須項目を入力ください");
                return;
            }


            this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", ["TEST", 0, 0]));



            var aExcelSet = []
            aPromise.push(this._callODataAction1(bEvent, aGroupItems));

            try {
                this._BusyDialog.open();

                Promise.all(aPromise).then((aContext) => {
                    this._BusyDialog.close();
                    //var aExcelSet = this.getModel("local").getProperty("/excelSet");

                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();

                        JSON.parse(object.Zzkey).forEach(element => {
                            var item1 = {
                                "Status": element.STATUS,
                                "Message": element.MESSAGE,
                                "CompanyCode": element.COMPANYCODE,

                                "Supplier": element.SUPPLIER,
                                "OrganizationBPName1": element.ORGANIZATIONBPNAME1,
                                "AmountInCompanyCodeCurrency": element.AMOUNTINCOMPANYCODECURRENCY,
                                "CompanyCodeCurrency": element.COMPANYCODECURRENCY,
                                "Counts": element.COUNTS,

                                "LastDate": element.LASTDATE,
                                "NetdueDate": element.NETDUEDATE,
                                "PaymentMethod": element.PAYMENTMETHOD,
                                "PaymentTerms": element.PAYMENTTERMS,

                                ConditionDate: element.CONDITIONDATE,

                                "AccountingClerkPhoneNumber": element.ACCOUNTINGCLERKPHONENUMBER,
                                "AccountingClerkFaxNumber": element.ACCOUNTINGCLERKFAXNUMBER,
                                "PaymentMethod_a": element.PAYMENTMETHOD_A,
                            };
                            aExcelSet.push(item1);

                        });
                    }

                    this.getModel("local").setProperty("/excelSet", aExcelSet);

                }).catch((error) => {
                    //MessageBox.error(error);
                    MessageBox.error("必須項目を入力ください");
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
                var uptests = this.getModel();

                var uploadProcess = this.getModel().bindContext("/PaymentMethod/com.sap.gateway.srvd.zui_paymethod_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.setParameter("RecordUUID", "");
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        },
        _callODataAction1: function (bEvent, aRequestData) {
            return new Promise((resolve, reject) => {
                var uptests = this.getModel();

                var uploadProcess = this.getModel().bindContext("/PaymentMethod/com.sap.gateway.srvd.zui_paymethod_o4.v0001.processSearch(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.setParameter("RecordUUID", "");
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });
});
