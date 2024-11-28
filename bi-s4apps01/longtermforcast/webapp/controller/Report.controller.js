sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../formatter/formatter"
], (Controller, Filter, FilterOperator, formatter) => {
    "use strict";

    return Controller.extend("bi.longtermforcast.controller.Report", {
        formatter: formatter,

        onInit() {
            this._setInitialValue();
        },

        _setInitialValue: function () {
            var oMonth = this.byId("sfbSelFiscalMonth");
            var oYear = this.byId("sfbDPFiscalYear");
            var oForcastYear = this.byId("sfbDPForcastYear");
            var oForcastMonth = this.byId("sfbSelForcastMonth");
            var dNow = new Date(Date.now());
            var nMonth = dNow.getMonth() + 1;
            var nYear = dNow.getFullYear();

            if (nMonth <= 3) {
                nMonth = nMonth + 10 - 1;
                nYear = nYear - 1;
            } else {
                nMonth = nMonth - 3;
            }

            var sMonth = nMonth < 10 ? `0${nMonth}` : String(nMonth);
            var sYear = String(nYear);

            oMonth.setSelectedKey(sMonth);
            oYear.setValue(sYear);

            var sForcastMonth = '', sForcastYear = '';
            if (sMonth === '12') {
                sForcastMonth = '01';
                sForcastYear = sYear + 1;
            } else {
                sForcastMonth = String(Number(sMonth) + 1).padStart(2, '0');
                sForcastYear = sYear;
            }

            oForcastMonth.setSelectedKeys([sForcastMonth]);
            oForcastYear.setValue(sForcastYear);
        },

        onBaseFiscalMonthChange: function(oEvent){
            debugger;
        },

        _setForcastSelection:function(sBaseYear, sBaseMonth){

        },

        onBeforeRebindTable: function (oEvent) {
            var oParameters = oEvent.getParameter("bindingParams");
            var oYear = this.byId("sfbDPFiscalYear");
            var oMonth = this.byId("sfbSelFiscalMonth");
            var oForcastYear = this.byId("sfbDPForcastYear");
            var oForcastMonth = this.byId("sfbSelForcastMonth");

            //Filter
            if (oYear) {
                var sYear = oYear.getValue();
                if (sYear !== '') {
                    oParameters.filters.push(
                        new Filter(
                            "BaseFiscalYear",
                            FilterOperator.EQ,
                            sYear
                        )
                    );
                }
            }

            if (oForcastYear) {
                var sForcastYear = oForcastYear.getValue();
                if (sForcastYear !== '') {
                    oParameters.filters.push(
                        new Filter(
                            "ForcastFiscalYear",
                            FilterOperator.EQ,
                            sForcastYear
                        )
                    );
                }
            }

            if (oMonth) {
                var sMonth = oMonth.getSelectedKey();
                oParameters.filters.push(
                    new Filter(
                        "BasePeriod",
                        FilterOperator.EQ,
                        sMonth
                    ));
            }

            if (oForcastMonth) {
                var aForcastMonth = oForcastMonth.getSelectedKeys();
                aForcastMonth.forEach(element => {
                    oParameters.filters.push(
                        new Filter(
                            "ForcastFiscalPeriod",
                            FilterOperator.EQ,
                            element
                        )
                    );
                });
            }
        }
    });
});