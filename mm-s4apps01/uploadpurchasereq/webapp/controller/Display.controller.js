sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "./messages",
	"sap/ui/model/Filter"
], function(
    BaseController,
    formatter,
    messages,
	Filter
) {
	"use strict";

	return BaseController.extend("mm.uploadpurchasereq.controller.Display", {
        formatter : formatter,
        onInit: function () {
            // this._BusyDialog = new BusyDialog();
            var oRouter = this.getRouter();
			oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);
        },
        onRowActionItemPress : function(oEvent){
			var oItem, oCtx;

			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext();

			this.getRouter().navTo("PurchaseReq",{
				contextPath : oCtx.getProperty("UUID")
			});
		},
        _onRouteMatched : function (oEvent) {
            this.getView().getModel().resetChanges();
			// var oArgs, oView;

			// oArgs = oEvent.getParameter("arguments");
			// oView = this.getView();

			// oView.bindElement({
			// 	path : "/PurchaseReq(guid'" + oArgs.contextPath + "')",
			// 	events : {
			// 		change: this._onBindingChange.bind(this),
			// 		dataRequested: function (oEvent) {
			// 			oView.setBusy(true);
			// 		},
			// 		dataReceived: function (oEvent) {
			// 			oView.setBusy(false);
			// 		}
			// 	}
			// });
			// this.byId("idSmartForm").setEditable(false);
			// this.byId("idPage").setShowFooter(false);
		},

		onBeforeRebindTable: function (oEvent) {
			var oFilter = oEvent.getParameter("bindingParams").filters;
			var oNewFilter, aNewFilter = [];
			var oCreatedAt = this.byId("idDatePicker").getDateValue();
			if (oCreatedAt) {
				aNewFilter.push(new Filter("CreatedAt", "EQ", formatter.convertLocalDateToUTCDate(oCreatedAt))); 
			}
			
			oNewFilter = new Filter({
				filters:aNewFilter,
				and:true
			});
			if (aNewFilter.length > 0) {
				oFilter.push(oNewFilter);
			}
		},
	});
});