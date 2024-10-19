sap.ui.define(
    ["sap/fe/core/AppComponent",
     "fico/agencypurchasingn/ext/controller/controller"
    ],
     
    function (Component,controller) {
        "use strict";

        return Component.extend("fico.agencypurchasingn.Component", {

            controller:controller,

            metadata: {
                manifest: "json"
            },

            onAfterRendering: function () {
                this.controller.init();
            }
        });
    }
);