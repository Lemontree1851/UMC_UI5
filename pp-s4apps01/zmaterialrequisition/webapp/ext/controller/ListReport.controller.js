sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox"
], function (ControllerExtension, MessageBox) {
    "use strict";

    var iExcuteTimes = 1;
    return ControllerExtension.extend("pp.zmaterialrequisition.ext.controller.ListReport", {

        override: {
            onPendingFilters: function () {
                var oFilterBar = this.getView().byId("pp.zmaterialrequisition::MaterialRequisitionList--fe::FilterBar::MaterialRequisition");
                if (oFilterBar && iExcuteTimes === 1) {
                    oFilterBar.attachSearch(this.onFilterSearch.bind(this));
                    iExcuteTimes -= 1;
                }
            }
        },

        onFilterSearch: function (oEvent) {
            var bHasError = false;
            var oTable = this.getView().byId("pp.zmaterialrequisition::MaterialRequisitionList--fe::table::MaterialRequisition::LineItem-innerTable");
            var aAuthorityPlantSet = this.getView().getModel("local").getProperty("/authorityCheck/data/PlantSet");
            var aFilterPlant = oEvent.getSource().getConditions().Plant;
            var sMessage = "";
            if (aFilterPlant) {
                aFilterPlant.forEach(filter => {
                    var sValue = filter.values[0];
                    if (aAuthorityPlantSet.length === 0) {
                        bHasError = true;
                        if (sMessage === "") {
                            sMessage = sValue;
                        } else {
                            sMessage = sMessage + "、" + sValue;
                        }
                    } else if (!aAuthorityPlantSet.some(data => data.Plant === sValue)) {
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
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityPlant", [sMessage]));
                oTable.setVisible(false);
            } else {
                oTable.setVisible(true);
            }
        }
    });
});