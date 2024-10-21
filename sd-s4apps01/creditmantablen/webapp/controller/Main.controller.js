sap.ui.define([
    "./Base",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],
function (Base,BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Base.extend("sd.creditmantablen.controller.Main", {
        onInit: function () {

        },
        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                sRequisitionDate,
                aNewFilters = [];
            var sEntitySet = oEvent.getSource().getProperty("entitySet");
            if (sEntitySet === "CREDITMANTABLE") {
                sRequisitionDate = this.getModel("local").getProperty("/dateValue");
                aNewFilters.push(new Filter("zyear", FilterOperator.EQ, sRequisitionDate));
                if (aNewFilters.length) {
                    oNewFilter = new Filter({
                        filters: aNewFilters,
                        and: false
                    });
                    aFilters.push(oNewFilter);
                }
            }
        },
        onSearch: function () {
            this.getModel().resetChanges();
        },
    });
});
