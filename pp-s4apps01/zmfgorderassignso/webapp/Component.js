sap.ui.define([
    "sap/suite/ui/generic/template/lib/AppComponent",
    "pp/zmfgorderassignso/ext/controller/ObjectPageExt.controller"
], function (Component, ObjectPageExt) {
    "use strict";

    return Component.extend("pp.zmfgorderassignso.Component", {

        ObjectPageExt: ObjectPageExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            this.ObjectPageExt.getAuthorityData(this.oModels);
        }
    });
});