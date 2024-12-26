sap.ui.define([
    "sap/fe/core/AppComponent",
    "fico/zstockageupload/ext/controller/ListReportAuth"
],
    function (Component, ListReportAuth) {
        "use strict";
        
        return Component.extend("fico.zstockageupload.Component", {
            ListReportAuth: ListReportAuth,
            metadata: {
                manifest: "json"
            },
            onAfterRendering: function () {
                ListReportAuth.init(this.oModels);
            }
        });
    }
);