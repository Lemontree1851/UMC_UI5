sap.ui.define([
    "sap/fe/core/AppComponent",
    "bc/zauthorityrolelist/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("bc.zauthorityrolelist.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            this.ListReportExt.getAuthorityData(this.oModels);
        }
    });
});