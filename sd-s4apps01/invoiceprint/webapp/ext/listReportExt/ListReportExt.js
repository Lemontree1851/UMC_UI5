sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "./messages"
], function(MessageToast) {
    'use strict';

    return {
        onPrint: function(oEvent) {
            var that = this;
            var aSelectedContexts = [];
            var oBusyDialog = new BusyDialog();
            if (this.getSelectedContexts) {
                aSelectedContexts = this.getSelectedContexts();
            }
            var aPromise = [];
            aSelectedContexts.forEach( function (item, index) {
                aPromise.push(this.callActionPrintInvoice(item, index));
            } );
            this._oDataModel.submitChanges({ groupId: "myId" });

            Promise.all(aPromise).then(function () {
                var pdfContent = this.porcessPrintContent(aSelectedContexts);
                this.getPDF(pdfContent);
            });
            // aSelectedContexts应该只是key值，具体的数据还要再取一次 item.getObject()
            var pdfContent = this.porcessPrintContent(aSelectedContexts);
        },

        callActionPrintInvoice: function (item, i) {
            var oModel = this._oDataModel;
                aDeferredGroups = oModel.getDeferredGroups();
            aDeferredGroups = aDeferredGroups.concat(["myId"]);
            oModel.setDeferredGroups(aDeferredGroups);

            var promise = new Promise(function (resolve,reject) {
                oModel.callFunction("/printinvoice", {
                    method: "POST",
                    groupId: "myId",//如果设置groupid，会多条一起进入action
                    changeSetId: i,
                    //建议只传输前端修改的参数，其他字段从后端获取
                    urlParameters: {
                        BillingDocument: item.BillingDocument,
                        BillingDocumentItem: item.BillingDocumentItem
                    },
                    success: function (oData) {
                        let result = JSON.parse(oData["printinvoice"]);
                    }.bind(this),
                    error: function (oError) {
                        this._LocalData.setProperty("/recordCheckSuccessed", false);
                        messages.showError(messages.parseErrors(oError));
                    }.bind(this)
                });
            }.bind(this));
            return promise;
        },

        //接收到从action返回的数据后，处理成PDF需要的
        porcessPrintContent: function (aSelectedItem) {

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
