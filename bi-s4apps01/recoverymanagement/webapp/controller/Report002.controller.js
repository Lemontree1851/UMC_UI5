sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
],
function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("bi.recoverymanagement.controller.Report002", {
        onInit: function () {
            this._setInitialValue();
        },

        _setInitialValue:function(){
            var oMonth = this.byId("sfbRep02SelFiscalMonth");
            var oYear = this.byId("sfbRep02DPRecoveryYear");
            var dNow = new Date(Date.now());
            var nMonth = dNow.getMonth() + 1;
            var nYear = dNow.getFullYear();

            if(nMonth <= 3){
                nMonth = nMonth + 10 - 1;
                nYear = nYear - 1;
            }else{
                nMonth = nMonth - 3;
            }

            var sMonth = nMonth < 10 ? `0${nMonth}` : String(nMonth);
            var sYear = String(nYear);

            oMonth.setSelectedKeys([sMonth]);
            oYear.setValue(sYear);
        },

        onBeforeRebindTable: function (oEvent) {
            var oParameters = oEvent.getParameter("bindingParams");
            var oYear = this.byId("sfbRep02DPRecoveryYear");
            var oMonth = this.byId("sfbRep02SelFiscalMonth");

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
                var aMonth = oMonth.getSelectedKeys();
                aMonth.forEach((e)=>{
                    oParameters.filters.push(
                        new Filter(
                            "FiscalMonth",
                            FilterOperator.EQ,
                            e
                        )
                    );  
                })
            }
        }
    });
});
