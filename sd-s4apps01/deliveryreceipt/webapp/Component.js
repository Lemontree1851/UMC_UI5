sap.ui.define([
    "sap/fe/core/AppComponent",
    "sd/deliveryreceipt/ext/ListReportExt"
    ],
    
    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("sd.deliveryreceipt.Component", {
            ListReportExt: ListReportExt,
            metadata: {
                manifest: "json"
            },
            onAfterRendering: function () {
                this.ListReportExt.init(this.oModels);
            }
        });
    }
);