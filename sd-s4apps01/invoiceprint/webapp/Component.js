sap.ui.define([
    "sap/fe/core/AppComponent",
    "sd/invoiceprint/ext/listReportExt/ListReportExt"
], function (Component, ListReportExt) {
    "use strict";

    return Component.extend("sd.invoiceprint.Component", {
        ListReportExt: ListReportExt,
        metadata: {
            manifest: "json"
        },
        onAfterRendering: function () {
            this.ListReportExt.init(this.oModels);
        }
    });
}
);