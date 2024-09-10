sap.ui.define([
    "sap/fe/core/AppComponent",
    "pp/zmaterialrequisition/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("pp.zmaterialrequisition.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            this.ListReportExt.init();
        }
    });
});