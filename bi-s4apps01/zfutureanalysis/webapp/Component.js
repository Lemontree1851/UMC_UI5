sap.ui.define(
    ["sap/fe/core/AppComponent",
     "bi/zfutureanalysis/ext/controller/ListReportAuth"
    ],
    function (Component,ListReportAuth) {
        "use strict";

        return Component.extend("bi.zfutureanalysis.Component", {
            ListReportAuth: ListReportAuth,
            metadata: {
                manifest: "json"
            },
            onAfterRendering: function () {
                this.ListReportAuth.init(this.oModels);
            }
        });
    }
);