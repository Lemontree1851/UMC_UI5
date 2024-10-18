sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "./messages"
], function(MessageToast, BusyDialog, messages) {
    'use strict';
    var _oFunctions, _ResourceBundle, _oDataModel;
    return {
        init: function (oEvent) {
            _oFunctions = this;
        },
        // 印刷和订正印刷， 订正印刷取当前选定的值，印刷需要按打印维度key取自建表已经存储的上次打印的条目的
        onPrint: function(oEvent) {
            debugger;
            _oDataModel = this.getModel();
            _ResourceBundle = this.getModel("i18n").getResourceBundle();

            var that = this;
            var aSelectedContexts = [];
            var oBusyDialog = new BusyDialog();
            
            // 获取选择的行项目
            if (this.getSelectedContexts) {
                aSelectedContexts = that.getSelectedContexts();
            }
            var aPromise = [];
            aSelectedContexts.forEach( function (item, index) {
                aPromise.push(_oFunctions.printDeliveryReceiptNo(item, index));
            } );
            // aPromise.push(_oFunctions.printDeliveryReceiptNo(aSelectedContexts, 1));
            // _oDataModel.submitChanges({ groupId: "myId" });

            Promise.all(aPromise).then(function (printRecords) {
                // var pdfContent = _oFunctions.porcessPrintContent(aSelectedContexts);
                // _oFunctions.getPDF(pdfContent);
            });
            // aSelectedContexts应该只是key值，具体的数据还要再取一次 item.getObject()
            // var pdfContent = _oFunctions.porcessPrintContent(aSelectedContexts);
        },

        printDeliveryReceiptNo: function (item, i) {
            // var oModel = _oDataModel;
            //     aDeferredGroups = oModel.getDeferredGroups();
            // aDeferredGroups = aDeferredGroups.concat(["myId"]);
            // oModel.setDeferredGroups(aDeferredGroups);

            var promise = new Promise(function (resolve,reject) {
                var printRecords = _oDataModel.bindContext("/DeliveryReceipt/com.sap.gateway.srvd.zui_deliveryreceipt_o4.v0001.printDeliveryReceiptNo(...)",item);
                // var printRecords = _oDataModel.bindContext("com.sap.gateway.srvd.zui_deliveryreceipt_o4.v0001.printDeliveryReceiptNo(...)",item);
                
                printRecords.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(( ) => {
                    resolve(printRecords);
                    var object = printRecords.getBoundContext().getObject(); //获取返回的数据
                    
                }).catch((oError) => {
                    console.log(oError.error);
                    reject(oError);
                });
            });
            return promise;

            // var promise = new Promise(function (resolve,reject) {
            //     oModel.callFunction("/printDeliveryReceiptNo", {
            //         method: "POST",
            //         groupId: "myId",//如果设置groupid，会多条一起进入action
            //         changeSetId: i,
            //         //建议只传输前端修改的参数，其他字段从后端获取
            //         urlParameters: {
            //             DeliveryDocument: item.DeliveryDocument,
            //             DeliveryDocumentItem: item.DeliveryDocumentItem
            //         },
            //         success: function (oData) {
            //             let result = JSON.parse(oData["printDeliveryReceiptNo"]);
            //         }.bind(this),
            //         error: function (oError) {
            //             this._LocalData.setProperty("/recordCheckSuccessed", false);
            //             messages.showError(messages.parseErrors(oError));
            //         }.bind(this)
            //     });
            // }.bind(this));
            // return promise;
        },

        porcessPrintContent: function (aSelectedItem) {
            // 检查选择的数据打印的维度是否一致，如果不一致则报错
            if (this.checkInconsistencies(aSelectedItem)) {
                messages.showError(this._ResourceBundle.getText("msgInconsistencies"));
                return;
            }
            // 将数据整理成打印需要的格式
            let pdfContent = {
                DELIVERYDOCUMENT: aSelectedItem[0].DeliveryDocument,
                SHIPTOPARTY: aSelectedItem[0].ShipToParty,
                POSTALCODE: aSelectedItem[0].PostalCode,
                CITYNAME: aSelectedItem[0].CityName,
                CUSTOMERNAME: aSelectedItem[0].CustomerName,
                _DELIVERYITEM: [],
                _RECEIPTITEM: []
            }
            let deliveryItems = [];
            let receiptItems = [];
            aSelectedItem.forEach(item => {
                deliveryItems.push({
                    REFERENCESDDOCUMENT: item.ReferenceSDDocument,
                    MATERIALBYCUSTOMER: item.MaterialByCustomer,
                    DELIVERYDOCUMENTITEMTEXT: item.DeliveryDocumentItemText,
                    ACTUALDELIVERYQUANTITY: item.ActualDeliveryQuantity,
                    DELIVERYQUANTITYUNIT: item.DeliveryQuantityUnit,
                    CONDITIONRATEVALUE: item.ConditionRateValue,
                    CONDITIONAMOUNT: item.ConditionAmount,
                });

                receiptItems.push({
                    REFERENCESDDOCUMENT: item.ReferenceSDDocument,
                    MATERIALBYCUSTOMER: item.MaterialByCustomer,
                    DELIVERYDOCUMENTITEMTEXT: item.DeliveryDocumentItemText,
                    ACTUALDELIVERYQUANTITY: item.ActualDeliveryQuantity,
                    DELIVERYQUANTITYUNIT: item.DeliveryQuantityUnit
                });
            });
            pdfContent._DELIVERYITEM = deliveryItems;
            pdfContent._RECEIPTITEM = receiptItems;

            return pdfContent;
        },
        getPDF: function (pdfContent) {
            var that = this;
            var oBusyDialog = new BusyDialog();
            var aRecordCreated = [];
            var promise = new Promise((resolve, reject) => {
                var createPrintRecord = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                createPrintRecord.setParameter("TemplateID", "YY1_DEMO_001");
                createPrintRecord.setParameter("IsExternalProvidedData", true);
                createPrintRecord.setParameter("ExternalProvidedData", atob(JSON.stringify(pdfContent)));
                // var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
                // createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ Uuid: uuidx16.toUpperCase() }));
                // createPrintRecord.setParameter("ResultIsActiveEntity", true);
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
                        var sPath = that.getModel("Print").getKeyPredicate("/PrintRecord", object);
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
                    aExcelSet[i].Type = "E";
                    aExcelSet[i].Message = this._ResourceBundle.getText("msgDuplicate");
                    isInconsistencies = true; // 发现不一致，返回 true
                }
            }
        
            return isInconsistencies; // 所有对象都一致，返回 false
        },
    };
});
