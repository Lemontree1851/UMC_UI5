sap.ui.define([
    "sap/fe/core/AppComponent",
    "bc/zprinttemplate/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("bc.zprinttemplate.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            this.ListReportExt.getAuthorityData(this.oModels);
        }
    });
});