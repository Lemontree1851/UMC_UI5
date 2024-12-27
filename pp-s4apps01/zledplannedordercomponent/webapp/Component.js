sap.ui.define(
    ["sap/fe/core/AppComponent",
     "pp/zledplannedordercomponent/ext/controller/ListReportExt"
    ],
    function (Component,ListReportExt) {
        "use strict";

        return Component.extend("pp.zledplannedordercomponent.Component", {
            ListReportExt:ListReportExt,

            metadata: {
                manifest: "json"
            },

            onAfterRendering: function () {
                this.ListReportExt.init(this.oModels);
            }
        });
    }
);