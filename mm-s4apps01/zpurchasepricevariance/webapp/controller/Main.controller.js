sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Base, formatter, Filter, FilterOperator) {
    "use strict";

    return Base.extend("mm.zpurchasepricevariance.controller.Main", {

        formatter: formatter,

        onInit: function () {

        },

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                aNewFilters = [];
            var bNoCompletelyDelivered = this.getModel("local").getProperty("/NoCompletelyDelivered");
            if (bNoCompletelyDelivered) {
                aNewFilters.push(new Filter("NoCompletelyDelivered", FilterOperator.EQ, "X"));
            } else {
                aNewFilters.push(new Filter("NoCompletelyDelivered", FilterOperator.EQ, ""));
            }
            if (aNewFilters.length) {
                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: false
                });
                aFilters.push(oNewFilter);
            }
        }
    });
});
