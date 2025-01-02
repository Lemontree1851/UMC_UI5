sap.ui.define([
    "sap/fe/core/AppComponent",
    "sd/shipmentstorageloc/ext/controller/ListReportExt"
    ],

    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("sd.shipmentstorageloc.Component", {
            metadata: {
                manifest: "json"
            },
            onAfterRendering: function () {
                ListReportExt.init(this.oModels);
            }
        });
    }
);