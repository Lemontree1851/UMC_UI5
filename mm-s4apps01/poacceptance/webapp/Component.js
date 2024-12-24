sap.ui.define([
    "sap/fe/core/AppComponent",
    "mm/poacceptance/ext/controller/ListReportExt"
],
    function (Component, ListReportExt) {
        "use strict";
   
        return Component.extend("mm.poacceptance.Component", {
            ListReportExt: ListReportExt,

            metadata: {
                manifest: "json"
            },

            onAfterRendering: function() {
                ListReportExt.init(this.oModels);
            }
        });
    }
);