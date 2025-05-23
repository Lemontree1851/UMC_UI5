sap.ui.define(
    ["sap/fe/core/AppComponent",
    "pp/zecn/ext/controller/ListReportExt"
    ],
    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("pp.zecn.Component", {
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