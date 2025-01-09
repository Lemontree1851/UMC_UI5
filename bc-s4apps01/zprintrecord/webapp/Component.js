sap.ui.define([
    "sap/fe/core/AppComponent",
    "bc/zprintrecord/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("bc.zprintrecord.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            this.ListReportExt.getAuthorityData(this.oModels);
        }
    });
});