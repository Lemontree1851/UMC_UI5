sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "../lib/json2XML",
    "../lib/xlsx",
    "sap/ui/model/type/Integer",
	"sap/ui/model/type/String",
	"sap/ui/model/type/Float",
	"sap/ui/model/type/Boolean",
	"sap/ui/model/odata/type/Date",
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
    "sap/m/Token"
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
                    createPrintRecord.setParameter("TemplateID", "YY1_ACCOUNT_PRT");
                    createPrintRecord.setParameter("IsExternalProvidedData", false);
                    //createPrintRecord.setParameter("IsExternalProvidedData", true);
                    
                    
                    var fiscalyear = context.getObject().fiscalyear.replace(/-/g, '');
                    var CompanyCode = context.getObject().Companycode.replace(/-/g, '');
                    var accountingdocument = context.getObject().accountingdocument.replace(/-/g, '');
 
 

                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify([
                        { CompanyCode: "1100", fiscalyear: "2024",accountingdocument: "3300000035" }, 
                        { CompanyCode: "1100", fiscalyear: "2024",accountingdocument: "1000000000" }
                    ]));
                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify(
                        { CompanyCode: "1100", fiscalyear: "2024",accountingdocument: "3300000035" }, 
                        { CompanyCode: "1100", fiscalyear: "2024",accountingdocument: "1000000000" }
                    ));   
                    let xmlString = jsonToXml(jsonData1); 
                    //xmlString = '<Form>' + xmlString + '</Form>'
                    //createPrintRecord.setParameter("ExternalProvidedData", btoa(xmlString));
                    createPrintRecord.setParameter("ExternalProvidedData", atob(""));
                    //createPrintRecord.setParameter("ProvidedKeys", "");
                    createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ CompanyCode: CompanyCode.toUpperCase(), fiscalyear:fiscalyear.toUpperCase(),accountingdocument: accountingdocument.toUpperCase()}));
                    
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
         onPrint1: function () {
            var aRecordCreated = [];
            var oBusyDialog = new BusyDialog();
            oBusyDialog.open();
            try {
                var that = this;
                var aSelectedContexts = [];

                if (this.getSelectedContexts) {
                    aSelectedContexts = this.getSelectedContexts();
                }
                var afilterSet = [];
                var aRecordCreated = [];
                var aPromise = [];
                var aGroupItems;
                aGroupItems = [];            
                var i = 0;
                for (const context of aSelectedContexts) { 
                    var fiscalyear = context.getObject().fiscalyear.replace(/-/g, '');
                    var CompanyCode = context.getObject().Companycode.replace(/-/g, '');
                    var accountingdocument = context.getObject().accountingdocument.replace(/-/g, '');
                   
                    var filterItems = {
                        "fiscalyear":fiscalyear,
                        "CompanyCode": CompanyCode ,
                        "accountingdocument": accountingdocument,
                    };
                    afilterSet.push(filterItems);
                    aGroupItems.push(afilterSet[i]);
                    i = i + 1;    
                }
                oBusyDialog.open();
                var promise = new Promise((resolve, reject) => {
                    // Merger PDF Begin
                    var sURL;
                    var mergerPDF = that.getModel("Print1").bindContext("/ZC_TFI_1012/com.sap.gateway.srvd_a2x.zapi_tfi_1012_o4.v0001.createPrintFile(...)");
                    mergerPDF.setParameter("Zzkey", JSON.stringify(aGroupItems));
                    mergerPDF.setParameter("Event","PRINT");
                    mergerPDF.setParameter("RecordUUID", "");
                    mergerPDF.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        var object = mergerPDF.getBoundContext().getObject();
                        var sPath = "(RecordUUID=" + object.RecordUUID + ",IsActiveEntity=true)";
                        var printPDF = that.getModel("Print").bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                        sURL = printPDF.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        //sURL = mergerPDF.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);
                        resolve(mergerPDF);
                        MessageToast.show("Print Success");
                    }).catch((oError) => {
                        reject(oError);
                    });
                });
                aRecordCreated.push(promise);
                oBusyDialog.open();
                try {
                    Promise.all(aRecordCreated).then((aContext) => {
                    }).finally(() => {
                        oBusyDialog.close();
                    });;
                } catch (error) {
                    MessageToast.show(error);
                    oBusyDialog.close();
                }

            } catch (error) {
                MessageToast.show(error);
                oBusyDialog.close();
            }

        } 
    };
}
);
