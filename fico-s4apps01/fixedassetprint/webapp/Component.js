sap.ui.define([
    "sap/fe/core/AppComponent",
    "fico/fixedassetprint/ext/controller/ListReportExt"
    ],
    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("fico.fixedassetprint.Component", {
            ListReportExt: ListReportExt,
            metadata: {
                manifest: "json"
            },
            onAfterRendering: function () {
                ListReportExt.init(this.oModels);
            }
        });
    }
);