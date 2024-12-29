sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox"
], function (ControllerExtension, MessageBox) {
    "use strict";

    var iExcuteTimes = 1;
    return ControllerExtension.extend("fico.zdaystocktrans.ext.controller.ListReport", {

        override: {
            onPendingFilters: function () {
                var oFilterBar = this.getView().byId("fico.zdaystocktrans::ZC_DAYSTOCKTRANSList--fe::FilterBar::ZC_DAYSTOCKTRANS");
                if (oFilterBar && iExcuteTimes === 1) {
                    oFilterBar.attachSearch(this.onFilterSearch.bind(this));
                    iExcuteTimes -= 1;
                }
            }
        },

        onFilterSearch: function (oEvent) {
            var bHasError = false;
            var oTable = this.getView().byId("fico.zdaystocktrans::ZC_DAYSTOCKTRANSList--fe::table::ZC_DAYSTOCKTRANS::LineItem-innerTable");
            var aAuthorityCompanySet = this.getView().getModel("local").getProperty("/authorityCheck/data/CompanySet");
            var aFilterCompany = oEvent.getSource().getConditions().CompanyCode;
            var sMessage = "";
            if (aFilterCompany) {
                aFilterCompany.forEach(filter => {
                    var sValue = filter.values[0];
                    if (aAuthorityCompanySet.length === 0) {
                        bHasError = true;
                        if (sMessage === "") {
                            sMessage = sValue;
                        } else {
                            sMessage = sMessage + "、" + sValue;
                        }
                    } else if (!aAuthorityCompanySet.some(data => data.CompanyCode === sValue)) {
                        bHasError = true;
                        if (sMessage === "") {
                            sMessage = sValue;
                        } else {
                            sMessage = sMessage + "、" + sValue;
                        }
                    }
                });
            }
            if (bHasError) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityCompany", [sMessage]));
                oTable.setVisible(false);
            } else {
                oTable.setVisible(true);
            }
        }
    });
});