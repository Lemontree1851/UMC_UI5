sap.ui.define(
    ["sap/fe/core/AppComponent",
     "fico/zdaystocktrans/ext/controller/ListReportAuth"
    ],
    function (Component,ListReportAuth) {
        "use strict";

        return Component.extend("fico.zdaystocktrans.Component", {
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