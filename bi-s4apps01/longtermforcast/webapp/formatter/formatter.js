sap.ui.define([
], function () {
    "use strict";
    return {

        formatCodeName: function (code, name) {
            if (code && name) {
                return `${name} (${code})`;
            } else if (code) {
                return `${code}`;
            } else if (name) {
                return `${name}`;
            }
        }
    }
});