sap.ui.define([
    "sap/fe/core/AppComponent",
    "fico/zbindglupload/ext/controller/ListReportAuth"
],
    function (Component, ListReportAuth) {
        "use strict";

        return Component.extend("fico.zbindglupload.Component", {
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