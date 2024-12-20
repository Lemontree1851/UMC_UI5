sap.ui.define([
    "sap/fe/core/AppComponent",
    "pp/zmfgorderinfo/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("pp.zmfgorderinfo.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            ListReportExt.init(this.oModels);
        }
    });
});