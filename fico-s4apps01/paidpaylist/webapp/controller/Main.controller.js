sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
],
    function (Controller, formatter) {
        "use strict";

        return Controller.extend("fico.paidpaylist.controller.Main", {
            formatter: formatter,

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();

            },

            onButtonSelect: function (oEvent) {
                var sOption1 = this.byId("Option1").getSelected();
                if (sOption1 === true) {

                    this.byId("PreStockAmt").setVisible(true);

                    this.byId("BegPurGrpAmt").setVisible(false);
                    this.byId("BegChgMaterialAmt").setVisible(false);
                    this.byId("BegCustomerRev").setVisible(false);
                    this.byId("BegRev").setVisible(false);

                } else {
                    this.byId("PreStockAmt").setVisible(false);

                    this.byId("BegPurGrpAmt").setVisible(true);
                    this.byId("BegChgMaterialAmt").setVisible(true);
                    this.byId("BegCustomerRev").setVisible(true);
                    this.byId("BegRev").setVisible(true);

                }
            },
            
            onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
                var mBindingParams = oEvent.getParameter("bindingParams");

                var oGjahr = new Date(this.byId("idGjahr").getValue());
                var oGjahrFilter = new sap.ui.model.Filter("FiscalYear", sap.ui.model.FilterOperator.EQ, oGjahr.getFullYear());
                mBindingParams.filters.push(oGjahrFilter);

                var sMonat = this.byId("idMonat").getSelectedKey();
                var oMonatFilter = new sap.ui.model.Filter("Period", sap.ui.model.FilterOperator.EQ, sMonat);
                mBindingParams.filters.push(oMonatFilter);

                var sOption1 = this.byId("Option1").getSelected();
                var newFilter;
                if (sOption1 === true) {
                    newFilter = new sap.ui.model.Filter("Ztype", sap.ui.model.FilterOperator.EQ, "A");
                } else {
                    newFilter = new sap.ui.model.Filter("Ztype", sap.ui.model.FilterOperator.EQ, "B");
                }
                mBindingParams.filters.push(newFilter);
            },

        });
    });
