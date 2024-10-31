sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/core/format/DateFormat",
],
function (Controller,formatter, Filter, DateFormat) {
    "use strict";

    return Controller.extend("pp.oflist.controller.Main", {
        formatter:formatter,
        onInit: function () {

        },
        onBeforeRebindTable: function (oEvent) {
            var oFilter = oEvent.getParameter("bindingParams").filters;
			var oNewFilter, aNewFilter = [];
			var sOnlyIsActiveSelectedKey = this.byId("idOnlyIsActive").getSelectedKey();
			if (sOnlyIsActiveSelectedKey === "1") {
				aNewFilter.push(new Filter("PlndIndepRqmtIsActive", "EQ", true)); 
			}
            var oDataRange = this.byId("idDateRangeSelection");
            if(oDataRange.getValue()) {
                var sDateFrom = DateFormat.getDateTimeInstance({pattern: oDataRange.getValueFormat()}).format(oDataRange.getFrom());
                var sDateTo = DateFormat.getDateTimeInstance({pattern: oDataRange.getValueFormat()}).format(oDataRange.getTo());
                aNewFilter.push(new Filter("RequirementDate", "BT", sDateFrom, sDateTo)); 
            }
			
			oNewFilter = new Filter({
				filters:aNewFilter,
				and:true
			});
			if (aNewFilter.length > 0) {
				oFilter.push(oNewFilter);
			}
        }
    });
});
