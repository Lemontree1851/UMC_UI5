sap.ui.define(
    ["sap/fe/core/AppComponent",
     "mm/podataanalysis/ext/controller/ListReportExt"
    ],

    function (Component, ListReportExt) {
        "use strict";

        return Component.extend("mm.podataanalysis.Component", {

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