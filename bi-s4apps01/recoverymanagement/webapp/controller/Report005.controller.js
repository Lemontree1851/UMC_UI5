sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
],
function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("recoverymanagement.controller.Report005", {
        onInit: function () {

        },

        onBeforeRebindTable: function (oEvent) {
            var oParameters = oEvent.getParameter("bindingParams");
            var oYear = this.byId("sfbRep05DPRecoveryYear");
            var oMonth = this.byId("sfbRep05SelFiscalMonth");

            //Filter
            if (oYear) {
                var sYear = oYear.getValue();
                if (sYear !== '') {
                    oParameters.filters.push(
                        new Filter(
                            "FiscalYear",
                            FilterOperator.EQ,
                            sYear
                        )
                    );
                }
            }


            if(oMonth){
                var sMonth = oMonth.getSelectedKey();
                if(sMonth !== ''){
                    oParameters.filters.push(
                        new Filter(
                            "FiscalMonth",
                            FilterOperator.EQ,
                            sMonth
                        )
                    );                    
                }
            }
        }
    });
});
