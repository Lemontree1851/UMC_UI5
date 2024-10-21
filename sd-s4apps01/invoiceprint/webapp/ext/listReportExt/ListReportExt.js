sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "./messages",
    "../../lib/xml-js",
], function(MessageToast, BusyDialog, messages, xml) {
    'use strict';
    var _oFunctions, _ResourceBundle, _oDataModel, _oPrintModel;
    return {
        init: function (oEvent) {
            _oFunctions = this;
        },
        onPrint: function(oEvent) {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"printInvoice");

        },

        onReprint: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"reprintInvoice");
        },

        onDelete: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"deleteInovice");
        },

        onCustomAction: function (aSelectedContexts,sActionName) {
            var aSelectedItem = [];
            var aPromise = [];
            var aItems = [];
            aSelectedContexts.forEach( function (item) {
                var itemObject = item.getObject();
                aSelectedItem.push(item.getObject());
                aItems.push({
                    BillingDocument: itemObject.BillingDocument,
                    BillingDocumentItem: itemObject.BillingDocumentItem,
                });
            } );
            if(_oFunctions.checkInconsistencies(aSelectedItem)) {
                messages.showError(_ResourceBundle.getText("msgInconsistencies"));
                return;
            }

            aPromise.push(_oFunctions.printAction(aItems,sActionName));

            Promise.all(aPromise).then(function (records) {
                records.forEach(record => {
                    if (sActionName !== "deleteInovice" ) {
                        var pdfContent = _oFunctions.porcessPrintContent(record);
                        _oFunctions.getPDF(pdfContent);
                    } else {
                        messages.showSuccess(_ResourceBundle.getText("msgDeleteSuccessed"));
                    }
                });
            });
        },

        printAction: function (items,sActionName) {
            var promise = new Promise(function (resolve,reject) {
                var oAction = _oDataModel.bindContext("/InvoiceReport/com.sap.gateway.srvd.zui_invoicereport_o4.v0001." + sActionName + "(...)");
                oAction.setParameter("Zzkey", JSON.stringify(items));
                oAction.setParameter("Event","");
                oAction.setParameter("RecordUUID","");
                
                oAction.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(( ) => {
                    try {
                        var records = oAction.getBoundContext().getObject().value; //获取返回的数据
                    } catch (e) {}
                    resolve(records);
                    
                }).catch((oError) => {
                    messages.showError(oError.message);
                    reject(oError);
                });
            });
            return promise;
        },

        //接收到从action返回的数据后，处理成PDF需要的
        porcessPrintContent: function (aSelectedItem) {
            // 检查选择的数据打印的维度是否一致，如果不一致则报错
            if (this.checkInconsistencies(aSelectedItem)) {
                messages.showError(_ResourceBundle.getText("msgInconsistencies"));
                return;
            }

            var pdfContent = {
                PrintData:{
                    results: []
                }
            };
            // 请求书抬头
            var InvoicePrint = {
                InvoiceNo: aSelectedItem[0].InvoiceNo,
                TheCompanyPostalCode: aSelectedItem[0].TheCompanyPostalCode,
                TheCompanyName: aSelectedItem[0].TheCompanyName,
                TheCompanyCity: aSelectedItem[0].TheCompanyCity,
                TheCompanyTelNumber: aSelectedItem[0].TheCompanyTelNumber,
                TheCompanyFaxNumber: aSelectedItem[0].TheCompanyFaxNumber,
                PostalCode: aSelectedItem[0].PostalCode,
                CityName: aSelectedItem[0].CityName,
                CustomerName: aSelectedItem[0].CustomerName,
                TelephoneNumber1: aSelectedItem[0].TelephoneNumber1,
                FaxNumber: aSelectedItem[0].FaxNumber,
                TotalNetAmount: aSelectedItem[0].TotalNetAmount,
                CompanyCodeParameterValue: aSelectedItem[0].CompanyCodeParameterValue,
                RemitAddress: aSelectedItem[0].RemitAddress,
                NetAmount10: aSelectedItem[0].NetAmount10,
                NetAmountTax10: aSelectedItem[0].NetAmountTax10,
                NetAmountIncludeTax10: aSelectedItem[0].NetAmountIncludeTax10,
                NetAmountExclude: aSelectedItem[0].NetAmountExclude,
                to_Item:{
                    results:[]
                }
            }
            // 请求书行项目
            var results = [];
            aSelectedItem.forEach(item => {
                results.push({
                    BillingDocumentItem: item.BillingDocumentItem,
                    BillingDocumentDate: item.BillingDocumentDate,
                    SalesDocument: item.SalesDocument,
                    MaterialByCustomer: item.MaterialByCustomer,
                    BillingDocumentItemText: item.BillingDocumentItemText,
                    BillingQuantity: item.BillingQuantity,
                    UnitPrice: item.UnitPrice,
                    NetAmount: item.NetAmount,
                    TaxRate: item.TaxRate,
                });
            });
            InvoicePrint.to_Item.results = results;
            pdfContent = {
                PrintData: InvoicePrint
            }
            return pdfContent;
        },

        getPDF: function (pdfContent) {
            var that = this;
            var oBusyDialog = new BusyDialog();
            var aRecordCreated = [];
            var promise = new Promise((resolve, reject) => {
                var createPrintRecord = _oPrintModel.bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                createPrintRecord.setParameter("TemplateID", "YY1_SD019");
                createPrintRecord.setParameter("IsExternalProvidedData", true);
                var oXMLData = json2xml(pdfContent, {
                    compact: true,
                    ignoreComment: true,
                    spaces: 4
                });
                // var pdfData =  btoa(unescape(encodeURIComponent(oXMLData)));
                var pdfData = btoa(unescape(encodeURIComponent("<?xml version=\"1.0\" encoding=\"UTF-8\"?><form>" + oXMLData + "</form>")));
                createPrintRecord.setParameter("ExternalProvidedData", pdfData);
                // var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
                createPrintRecord.setParameter("ProvidedKeys", "");
                createPrintRecord.setParameter("ResultIsActiveEntity", true);
                createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(createPrintRecord);
                }).catch((oError) => {
                    reject(oError);
                });
            });
            aRecordCreated.push(promise);

            oBusyDialog.open();
            try {
                Promise.all(aRecordCreated).then((aContext) => {
                    oBusyDialog.close();
                    var sURL;
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var sPath = _oPrintModel.getKeyPredicate("/PrintRecord", object);
                        sURL = activeContext.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);
                    }
                    MessageToast.show("Print Success");
                }).finally(() => {
                    oBusyDialog.close();
                });;
            } catch (error) {
                MessageToast.show(error);
                oBusyDialog.close();
            }
        },
        
        checkInconsistencies: function (aExcelSet) {
            let isInconsistencies = false;
            // 如果数组为空或只有一个对象，直接返回一致
            if (aExcelSet.length <= 1) return false;
        
            // 取第一个对象的这几个属性作为比较基准
            const { SoldToParty, ShippingPoint } = aExcelSet[0];
        
            // 遍历数组，检查每个对象的这几个属性是否与基准一致
            for (let i = 1; i < aExcelSet.length; i++) {
                const obj = aExcelSet[i];
                if (
                    obj.SoldToParty !== SoldToParty ||
                    obj.ShippingPoint !== ShippingPoint
                ) {
                    // aExcelSet[i].Type = "E";
                    // aExcelSet[i].Message = this._ResourceBundle.getText("msgDuplicate");
                    isInconsistencies = true; // 发现不一致，返回 true
                }
            }
        
            return isInconsistencies; // 所有对象都一致，返回 false
        },
    };
});
