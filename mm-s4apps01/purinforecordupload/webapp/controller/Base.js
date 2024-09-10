sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    'sap/ui/core/Fragment',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, UIComponent, History, MessageBox, Fragment, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("mm.purinforecordupload.controller.Base", {

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
         * Convenience method for navigation to specific view
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         * @param {boolean} pbReplace? Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
         */
        navTo: function (psTarget, pmParameters, pbReplace) {
            this.getRouter().navTo(psTarget, pmParameters, pbReplace);
        },

        /**
         * Convenience method for set current screen is busy
         * @public
         * @param {boolean} bFlag? Defines if the current screen is busy
         */
        setBusy: function (bFlag) {
            this.getModel("local").setProperty("/appProperties/busy", bFlag);
            this.getModel("local").refresh();
        },

        /**
         * Convenience method for get UUID
         * @public
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
         * Convenience method for get current date and time
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
         * Convenience method for routing back and history
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         */
        onNavBack(psTarget, pmParameters) {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.navTo(psTarget, pmParameters, false);
            }
        },

        /**
         * Convenience method for remove duplicates
         * @public
         * @param {array} arr array object
         * @param {array} keys keys
         */
        removeDuplicates: function (arr, keys) {
            return arr.reduce((result, obj) => {
                const index = result.findIndex(item => {
                    return keys.every(key => item[key] === obj[key]);
                });
                if (index !== -1) {
                    result[index] = obj;
                } else {
                    result.push(obj);
                }
                return result;
            }, []);
        },

        /**
         * Convenience method for show success dialog
         * @public
         * @param {string} sMessage message content
         * @param {string} fnOK Processing when OK is pressed
         */
        showSuccessDialog: function (sMessage, fnOK) {
            MessageBox.success(sMessage, {
                actions: [MessageBox.Action.OK],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    // Execute CallBack when OK button is pressed
                    if (sAction === MessageBox.Action.OK) {
                        fnOK(this);
                    }
                }.bind(this)
            });
        },

        /**
         * Convenience method for show warning dialog
         * @public
         * @param {string} sMessage message content
         * @param {string} fnContinue Processing when IGNORE is pressed
         * @param {string} fnCancel Processing when CANCEL is pressed
         */
        showWarningDialog: function (sMessage, fnContinue, fnCancel) {
            MessageBox.warning(sMessage, {
                actions: [MessageBox.Action.IGNORE, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.CANCEL,
                onClose: function (sAction) {
                    // Execute CallBack when IGNORE button is pressed
                    if (sAction === MessageBox.Action.IGNORE) {
                        fnContinue(this);
                    } else {
                        fnCancel(this);
                    }
                }.bind(this)
            });
        },

        /**
         * Convenience method for show confirm dialog
         * @public
         * @param {string} sMessage message content
         * @param {string} fnYES Processing when YES is pressed
         * @param {string} fnNO Processing when NO is pressed
         */
        showConfirmDialog: function (sMessage, fnYES, fnNO) {
            MessageBox.confirm(sMessage, {
                actions: ["Yes", "Go Back"],
                emphasizedAction: "Yes",
                onClose: function (sAction) {
                    // Execute CallBack when YES button is pressed
                    if (sAction === "Yes") {
                        fnYES(this);
                    } else {
                        fnNO(this);
                    }
                }.bind(this)
            });
        }
    })
});