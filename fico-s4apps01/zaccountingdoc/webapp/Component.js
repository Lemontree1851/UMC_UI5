sap.ui.define([
         "sap/fe/core/AppComponent", 
        "fico/zaccountingdoc/ext/controller/ListReportExt"

    ],
    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("fico.zaccountingdoc.Component", {
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