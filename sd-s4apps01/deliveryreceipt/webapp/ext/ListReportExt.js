sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "./messages",
    "../lib/xml-js",
], function(MessageToast, BusyDialog, messages, xml) {
    'use strict';
    var _oFunctions, _ResourceBundle, _oDataModel, _oPrintModel;
    return {
        init: function (oEvent) {
            _oFunctions = this;
        },
        // 印刷和订正印刷， 订正印刷取当前选定的值，印刷需要按打印维度key取自建表已经存储的上次打印的条目的
        onPrint: function(oEvent) {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"printDeliveryReceiptNo");
        },

        onReprint: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"reprintDeliveryReceiptNo");
        },

        onDelete: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts,"deleteDeliveryReceiptNo");
        },

        onCustomAction: function (aSelectedContexts,sActionName) {
            var aSelectedItem = [];
            var aPromise = [];
            var aItems = [];
            aSelectedContexts.forEach( function (item) {
                var itemObject = item.getObject();
                aSelectedItem.push(item.getObject());
                aItems.push({
                    DeliveryDocument: itemObject.DeliveryDocument,
                    DeliveryDocumentItem: itemObject.DeliveryDocumentItem,
                });
            } );
            if(_oFunctions.checkInconsistencies(aSelectedItem)) {
                messages.showError(_ResourceBundle.getText("msgInconsistencies"));
                return;
            }

            aPromise.push(_oFunctions.printAction(aItems,sActionName));

            Promise.all(aPromise).then(function (records) {
                records.forEach(record => {
                    if (sActionName !== "deleteDeliveryReceiptNo" ) {
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
                var oAction = _oDataModel.bindContext("/DeliveryReceipt/com.sap.gateway.srvd.zui_deliveryreceipt_o4.v0001." + sActionName + "(...)");
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
            // 纳品书抬头
            var _DELIVERYITEM = {
                DELIVERYRECEIPTNO: aSelectedItem[0].DeliveryReceiptNo,
                SHIPTOPARTY: aSelectedItem[0].ShipToParty,
                POSTALCODE: aSelectedItem[0].PostalCode,
                CITYNAME: aSelectedItem[0].CityName,
                CUSTOMERNAME: aSelectedItem[0].CustomerName,
                DeliveryItem: {results:[]}
            };
            //受领书抬头
            var _RECEIPTITEM = {
                DELIVERYRECEIPTNO: aSelectedItem[0].DeliveryReceiptNo,
                SHIPTOPARTY: aSelectedItem[0].ShipToParty,
                POSTALCODE: aSelectedItem[0].PostalCode,
                CITYNAME: aSelectedItem[0].CityName,
                CUSTOMERNAME: aSelectedItem[0].CustomerName,
                ReceiptItem: {results:[]}
            };

            aSelectedItem.forEach(function(item, index) {
                // 纳品书
                _DELIVERYITEM.DeliveryItem.results.push({
                    REFERENCESDDOCUMENT: item.ReferenceSDDocument,
                    MATERIALBYCUSTOMER: item.MaterialByCustomer,
                    DELIVERYDOCUMENTITEMTEXT: item.DeliveryDocumentItemText,
                    ACTUALDELIVERYQUANTITY: item.ActualDeliveryQuantity,
                    DELIVERYQUANTITYUNIT: item.DeliveryQuantityUnit,
                    CONDITIONRATEVALUE: item.ConditionRateValue,
                    CONDITIONAMOUNT: item.ConditionAmount,
                });
                //受领书
                _RECEIPTITEM.ReceiptItem.results.push({
                    REFERENCESDDOCUMENT: item.ReferenceSDDocument,
                    MATERIALBYCUSTOMER: item.MaterialByCustomer,
                    DELIVERYDOCUMENTITEMTEXT: item.DeliveryDocumentItemText,
                    ACTUALDELIVERYQUANTITY: item.ActualDeliveryQuantity,
                    DELIVERYQUANTITYUNIT: item.DeliveryQuantityUnit
                });
                // pdf每页固定显示5行，在pdf中不好控制，所以在此处将数据分页
                if ((index + 1) % 5 === 0 || index + 1 === aSelectedItem.length ) {
                    pdfContent.PrintData.results.push({
                        _DELIVERYITEM: JSON.parse(JSON.stringify(_DELIVERYITEM)),
                        _RECEIPTITEM: JSON.parse(JSON.stringify(_RECEIPTITEM)),
                    });
                    _DELIVERYITEM.DeliveryItem = {results:[]};
                    _RECEIPTITEM.ReceiptItem = {results:[]};
                }
            });

            return pdfContent;
        },
        getPDF: function (pdfContent) {
            var that = this;
            var oBusyDialog = new BusyDialog();
            var aRecordCreated = [];
            var sFileName = _ResourceBundle.getText("appTitle") + new Date().getTime();
            var promise = new Promise((resolve, reject) => {
                var createPrintRecord = _oPrintModel.bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                createPrintRecord.setParameter("TemplateID", "YY1_SD018");
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
                createPrintRecord.setParameter("FileName", sFileName);
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
                    // aExcelSet[i].Message = _ResourceBundle.getText("msgInconsistencies");
                    
                    isInconsistencies = true; // 发现不一致，返回 true
                }
            }

        
            return isInconsistencies; // 所有对象都一致，返回 false
        },
    };
});
