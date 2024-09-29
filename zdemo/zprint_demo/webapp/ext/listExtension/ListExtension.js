sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog"
], function (MessageToast, BusyDialog) {
    'use strict';

    return {
        onPrint: function () {
            var that = this;
            var aSelectedContexts = [];
            var oBusyDialog = new BusyDialog();
            if (this.getSelectedContexts) {
                aSelectedContexts = this.getSelectedContexts();
            }
            var aRecordCreated = [];
            for (const context of aSelectedContexts) {
                var promise = new Promise((resolve, reject) => {
                    var createPrintRecord = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                    createPrintRecord.setParameter("TemplateID", "YY1_DEMO_001");
                    createPrintRecord.setParameter("IsExternalProvidedData", false);
                    createPrintRecord.setParameter("ExternalProvidedData", atob(""));
                    var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ Uuid: uuidx16.toUpperCase() }));
                    createPrintRecord.setParameter("ResultIsActiveEntity", true);
                    createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        resolve(createPrintRecord);
                    }).catch((oError) => {
                        reject(oError);
                    });
                });
                aRecordCreated.push(promise);
            }
            oBusyDialog.open();
            try {
                Promise.all(aRecordCreated).then((aContext) => {
                    oBusyDialog.close();
                    var sURL;
                    var aDocuments = [];
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var sPath = that.getModel("Print").getKeyPredicate("/PrintRecord", object);
                        sURL = activeContext.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);

                        aDocuments.push({
                            uuid: object.RecordUUID
                        });
                    }
                    
                    // Merger PDF Begin
                    var mergerPDF = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.mergerPDF(...)");
                    mergerPDF.setParameter("TemplateID", "YY1_DEMO_001");
                    mergerPDF.setParameter("Zzkey", JSON.stringify(aDocuments));
                    mergerPDF.setParameter("RecordUUID", "");
                    mergerPDF.setParameter("ResultIsActiveEntity", true);
                    mergerPDF.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        var object = mergerPDF.getBoundContext().getObject();
                        var sPath = "(RecordUUID=" + object.RecordUUID + ",IsActiveEntity=true)";
                        sURL = mergerPDF.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);
                    }).catch((oError) => {
                        reject(oError);
                    });
                    // Merger PDF End

                    MessageToast.show("Print Success");
                }).finally(() => {
                    oBusyDialog.close();
                });;
            } catch (error) {
                MessageToast.show(error);
                oBusyDialog.close();
            }
        },

        onSendEmail: function () {
            var that = this;
            var aSelectedContexts = [];
            var oBusyDialog = new BusyDialog();
            if (this.getSelectedContexts) {
                aSelectedContexts = this.getSelectedContexts();
            }
            var aRecordCreated = [];

            // *************************************************
            var aMessageItems = [];
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                counter: 1
            });
            this.oMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "/MessageItems",
                    template: oMessageTemplate
                }
            });
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    that.oMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            this.oMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: this.oMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        that.oMessageDialog.close();
                        debugger
                    },
                    text: "Close"
                }),
                customHeader: new sap.m.Bar({
                    contentLeft: [oBackButton],
                    contentMiddle: [
                        new sap.m.Title({
                            text: "Send Results",
                            level: "H1"
                        })
                    ]
                }),
                contentHeight: "50%",
                contentWidth: "30%",
                verticalScrolling: false
            });
            // *************************************************

            for (const context of aSelectedContexts) {
                var promise = new Promise((resolve, reject) => {
                    var createPrintRecord = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                    createPrintRecord.setParameter("TemplateID", "YY1_DEMO_001");
                    createPrintRecord.setParameter("IsExternalProvidedData", false);
                    createPrintRecord.setParameter("ExternalProvidedData", atob(""));
                    var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ Uuid: uuidx16.toUpperCase() }));
                    createPrintRecord.setParameter("ResultIsActiveEntity", true);
                    createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        resolve(createPrintRecord);
                    }).catch((oError) => {
                        reject(oError);
                    });
                });
                aRecordCreated.push(promise);
            }
            oBusyDialog.open();
            try {
                Promise.all(aRecordCreated).then((aContext) => {
                    var aRecordEmail = [];
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var promise = new Promise((resolve, reject) => {
                            var sendEmail = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.sendEmail(...)");
                            sendEmail.setParameter("RecordUUID", object.RecordUUID);
                            var aRecipients = [];
                            aRecipients.push({
                                "emailaddress": "xinlei.xu@sh.shin-china.com"
                            })
                            sendEmail.setParameter("Zzkey", JSON.stringify(aRecipients));
                            sendEmail.setParameter("ResultIsActiveEntity", true);
                            sendEmail.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                                resolve(sendEmail);
                            }).catch((oError) => {
                                reject(oError);
                            });
                        });
                        aRecordEmail.push(promise);
                    }
                    Promise.all(aRecordEmail).then((aContext) => {
                        oBusyDialog.close();
                        for (const activeContext of aContext) {
                            var boundContext = activeContext.getBoundContext();
                            var object = boundContext.getObject();
                            var messageItem = JSON.parse(object.Zzkey);
                            aMessageItems.push({
                                type: messageItem.TYPE,
                                title: messageItem.TITLE,
                                description: messageItem.DESCRIPTION,
                            });
                        }
                        that.getModel("local").setProperty("/MessageItems", aMessageItems);
                        that.oMessageView.setModel(this.getModel("local"));
                    }).finally(() => {
                        oBusyDialog.close();
                        that.oMessageView.navigateBack();
                        that.oMessageDialog.open();
                    });
                }).finally(() => {
                    oBusyDialog.close();
                });;
            } catch (error) {
                MessageToast.show(error);
                oBusyDialog.close();
            }
        }
    };
});
