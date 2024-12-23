sap.ui.define([
    "sap/fe/core/AppComponent",
    "pp/zbom/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
        "use strict";

        return Component.extend("pp.zbom.Component", {

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