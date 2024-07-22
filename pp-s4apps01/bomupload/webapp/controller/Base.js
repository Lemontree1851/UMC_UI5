sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("pp.bomupload.controller.Base", {

        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Method for navigation to specific view
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         * @param {boolean} pbReplace? Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
         */
        navTo: function (psTarget, pmParameters, pbReplace) {
            this.getRouter().navTo(psTarget, pmParameters, pbReplace);
        },

        /**
         * Get UUID
         * @param {*} len the desired number of characters
         * @param {*} radix the number of allowable values for each character
         * EXAMPLES:
         * No arguments  - returns RFC4122, version 4 ID
         *   >>> getUuid()   
         *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
         * One argument  - returns ID of the specified length
         *   >>> getUuid(15)    // 15 character ID (default base=62)
         *   "VcydxgltxrVZSTV" 
         * Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
         *   >>> getUuid(8, 2)  // 8 character ID (base=2)
         *   "01001010"
         *   >>> getUuid(8, 10) // 8 character ID (base=10)
         *   "47473046"
         *   >>> getUuid(8, 16) // 8 character ID (base=16)
         *   "098F4D35"
         */
        getUuid: function (len, radix) {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
            var uuid = [],
                i;
            radix = radix || chars.length;
            if (len) {
                // Compact form
                for (i = 0; i < len; i++) {
                    uuid[i] = chars[0 | (Math.random() * radix)];
                }
            } else {
                // rfc4122, version 4 form
                var r;
                // rfc4122 requires these characters
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
                uuid[14] = "4";
                // Fill in random data.  At i==19 set the high bits of clock sequence as
                // per rfc4122, sec. 4.1.5
                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | (Math.random() * 16);
                        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
                    }
                }
            }
            return uuid.join("");
        },

        /**
         * Get Current Date and Time
         * @public
         */
        getCurrentDateTime: function () {
            var date = new Date();
            var sTime = date.getFullYear().toString() +
                this._pad2(date.getMonth() + 1) +
                this._pad2(date.getDate()) +
                this._pad2(date.getHours()) +
                this._pad2(date.getMinutes()) +
                this._pad2(date.getSeconds());
            return sTime;
        },

        /**
         * Complete the value to two digits
         * @private
         * @param {Number string} n
         */
        _pad2: function (n) {
            return n < 10 ? "0" + n : n;
        }
    });
});