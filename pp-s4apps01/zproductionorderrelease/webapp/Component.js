sap.ui.define([
    "sap/suite/ui/generic/template/lib/AppComponent",
    "pp/zproductionorderrelease/ext/controller/ListReportAuthCheck"
],
function (Component, ListReportAuthCheck) {
    "use strict";

    return Component.extend("pp.zproductionorderrelease.Component", {

        ListReportAuthCheck: ListReportAuthCheck,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            ListReportAuthCheck.init(this.oModels);
        }
    });
}
);