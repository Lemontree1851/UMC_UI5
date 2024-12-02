sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog"
],function (MessageToast, BusyDialog) {
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
                    createPrintRecord.setParameter("TemplateID", "YY1_FIXPRINTS");
                    createPrintRecord.setParameter("IsExternalProvidedData", false);
                    createPrintRecord.setParameter("ExternalProvidedData", atob(""));
                    var CompanyCode = context.getObject().CompanyCode.replace(/-/g, '');
                    var MasterFixedAsset = "0000" + context.getObject().MasterFixedAsset;
                    var FixedAsset = "000" + context.getObject().FixedAsset.replace(/-/g, '');
                    var ValidityEndDate = context.getObject().ValidityEndDate.replace(/-/g, '');

                    //MasterFixedAsset = padWithZeros(MasterFixedAsset, 12);
                    //var MasterFixedAsset = "000010000000";
                    //var FixedAsset = "0000".
                    //console.log(FixedAsset);

                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ CompanyCode: CompanyCode.toUpperCase(), MasterFixedAsset: MasterFixedAsset.toUpperCase(),FixedAsset: FixedAsset.toUpperCase(),ValidityEndDate: ValidityEndDate.toUpperCase()}));
                    //createPrintRecord.setParameter("ProvidedKeys", "");
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
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var sPath = that.getModel("Print").getKeyPredicate("/PrintRecord", object);
                        sURL = activeContext.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        //console.log("sURL"+sURL)
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
        }

    };
}
);
