sap.ui.define([
    "sap/m/MessageToast"
], function(MessageToast) {
    'use strict';

    return {
        onRelease: function(oEvent) {
            MessageToast.show("Custom handler invoked.");
        }
    };
});