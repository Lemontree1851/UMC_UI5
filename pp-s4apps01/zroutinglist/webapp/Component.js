sap.ui.define([
    "sap/fe/core/AppComponent",
    "pp/zroutinglist/ext/controller/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("pp.zroutinglist.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            ListReportExt.init(this.oModels);
        }
    });
});