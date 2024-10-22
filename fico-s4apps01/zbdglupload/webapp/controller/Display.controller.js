sap.ui.define([
    "./Base",
    "../model/formatter",
    "./messages"
], function(
    BaseController,
    formatter,
    messages
) {
	"use strict";

	return BaseController.extend("fico.zbdglupload.controller.Display", {
        formatter : formatter,
        onInit: function () {
            // this._BusyDialog = new BusyDialog();
            var oRouter = this.getRouter();
			oRouter.getRoute("Main").attachMatched(this._onRouteMatched, this);
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
	});
});