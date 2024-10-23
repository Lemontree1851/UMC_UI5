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
            var bExcludeDeliveredPO = this.getModel("local").getProperty("/ExcludeDeliveredPO");
            if (bExcludeDeliveredPO) {
                aNewFilters.push(new Filter("IsCompletelyDelivered", FilterOperator.EQ, false));
                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: false
                });
                aFilters.push(oNewFilter);
            }
        }
    });
});
