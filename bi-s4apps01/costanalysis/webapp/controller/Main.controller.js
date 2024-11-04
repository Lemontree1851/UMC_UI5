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
			// // var oSearchBar = this.byId("idSmartFilterBar1");
			// // var oTable = this.byId("tablelist");
			// // var aFilters = oSearchBar.getFilters();

			// // var sYear = this.getModel("local").getProperty("/zYear");
			// // if (sYear) {
            // //     aFilters.push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));
			// // }
			// // var sMonth = this.getModel("local").getProperty("/zMonth");
			// // if (sMonth) {
			// // 	aFilters.push(new Filter("zMonth", FilterOperator.EQ, sMonth.getFullYear()));
			// // }

            // // // oSearchBar.getFilters().push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));
            // // this.byId("idSmartFilterBar1").setFilterData(aFilters,true);   
        
            // // var bFilters = oSearchBar.getFilters();
			// // var oFilterData = oSearchBar.getFilterData(); 
            
            // var filterData = this.byId("idSmartFilterBar1").getFilterData();
            // var sYear = this.getModel("local").getProperty("/zYear").getFullYear();
            // var oGjahr = "=" + sYear;
            // var condition = {exclude: false, operation: "EQ", keyField: "zYear", tokenText:oGjahr, value1:sYear, value2: null};
            // // if (filterData.zYear) {
            // //  filterData.zYear.ranges[0] = condition;
            // // } else {
            // //  filterData.zYear = {items: [], ranges:[condition], value: null};
            // // }
            // filterData.zYear = sYear;
            // this.byId("idSmartFilterBar1").setFilterData(filterData,true);    
            // // this.byId("idSmartFilterBar1").setFiltes  

            // var afilterData = this.byId("idSmartFilterBar1").getFilterData();

 
        },
		onBeforeRebindTable: function (oEvent) {

            var sYear = this.getModel("local").getProperty("/zYear").getFullYear();
            var oYear = {oValue1:sYear, oValue2: null, sOperator: "EQ", sPath: "zYear", _bMultiFilter:false};

            oEvent.getParameter("bindingParams").filters.push(oYear);

            var sMonth = this.getModel("local").getProperty("/zMonth").getMonth() + 1;
            var oMonth = {oValue1:sMonth, oValue2: null, sOperator: "EQ", sPath: "zMonth", _bMultiFilter:false};

            oEvent.getParameter("bindingParams").filters.push(oMonth);





		},



    });
});
