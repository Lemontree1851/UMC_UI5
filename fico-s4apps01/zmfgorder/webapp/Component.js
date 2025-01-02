sap.ui.define( [
    "sap/fe/core/AppComponent",
    "fico/zmfgorder/ext/controller/ListReportExt"
    ],
    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("fico.zmfgorder.Component", {
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