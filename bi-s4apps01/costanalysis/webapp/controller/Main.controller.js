sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],
function (Base,formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Base.extend("bi.costanalysis.controller.Main", {

 
        formatter: formatter,
        onInit: function () {

        },
        onSearch: function () {
            this.getModel().resetChanges();
			var oSearchBar = this.byId("idSmartFilterBar1");
			var oTable = this.byId("tablelist");
			var aFilters = oSearchBar.getFilters();

			var sYear = this.getModel("local").getProperty("/zYear");
			if (sYear) {
				aFilters.push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));
			}
			var sMonth = this.getModel("local").getProperty("/zMonth");
			if (sMonth) {
				aFilters.push(new Filter("zMonth", FilterOperator.EQ, sMonth.getFullYear()));
			}

            oSearchBar.getFilters().push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));

            var bFilters = oSearchBar.getFilters();
			var oFilterData = oSearchBar.getFilterData(); 
        },




    });
});
