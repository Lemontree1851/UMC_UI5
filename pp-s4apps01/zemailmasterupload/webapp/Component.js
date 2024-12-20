sap.ui.define([
    "sap/fe/core/AppComponent",
    "pp/zemailmasterupload/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("pp.zemailmasterupload.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            ListReportExt.init(this.oModels);
        }
    });
});