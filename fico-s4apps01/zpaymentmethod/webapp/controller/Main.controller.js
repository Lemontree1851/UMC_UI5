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
	"../model/formatter1",
    "sap/m/Token"
], function (Base, formatter, xlsx, BusyDialog, MessageBox) {
    "use strict";

    return Base.extend("fico.zpaymentmethod.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
            this.getOwnerComponent().getModel("local").setProperty("/headSet", {});

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

            var header = this.getModel("local").getProperty("/headSet");
            var aPLANT =  this.getModel("local").getProperty("/headSet/Plant");
            var aCompanyCode =  this.getModel("local").getProperty("/headSet/CompanyCode");

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
            this._callOData1("SEARCH");
        },
        onClear: function () {
            this.getModel("local").setProperty("/excelSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },

        onCheck: function () {
            this._callOData("CHECK");
        },

        onExcute: function ()  {
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
                                   
                                    
                                }
                            }
                        }); }
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

            var aTokens = this.getView().byId("idCompanyCode").getTokens();
            var afilterSet = [];
            for (var i = 0; i < aTokens.length; i++) {
                var filterItems = {
                    "NAME":"CompanyCode",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW" : aTokens[i].getProperty("key"),
                    "HIGH" : ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
            }

            var aTokens = this.getView().byId("idCustomer").getTokens();
            var afilterSet = [];
            for (var i = 0; i < aTokens.length; i++) {
                var filterItems = {
                    "NAME":"Customer",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW" : aTokens[i].getProperty("key"),
                    "HIGH" : ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
            }

            var aTokens = this.getView().byId("idPaymentMethod").getTokens();
            var afilterSet = [];
            for (var i = 0; i < aTokens.length; i++) {
                var filterItems = {
                    "NAME":"PaymentMethod",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW" : aTokens[i].getProperty("key"),
                    "HIGH" : ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
            }
            //var aTokens = this.getView().byId("idReceiver").getTokens();
            var afilterSet = [];

                var filterItems = {
                    "NAME":"Receiver",
                    "SIGN": "I",
                    "OPTION": "EQ",
                    "LOW" : this.getView().byId("idReceiver")._lastValue,
                    "HIGH" : ""
                };
                afilterSet.push(filterItems);
                aGroupItems.push(afilterSet[i]);
          

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
                    MessageBox.error("请检查必输");
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
                console.log("WWWWW"+uptests);
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
