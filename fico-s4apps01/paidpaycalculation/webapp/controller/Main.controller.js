sap.ui.define([
	"./Base",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/BusyDialog",
	"sap/m/MessageBox",
],
	function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox) {
		"use strict";

		return Base.extend("fico.paidpaycalculation.controller.Main", {
			formatter: formatter,

			onInit: function () {
				this._LocalData = this.getOwnerComponent().getModel("local");
				this._oDataModel = this.getOwnerComponent().getModel();
				this._BusyDialog = new BusyDialog();
			},

			onButtonSelect: function (oEvent) {
				var sOption1 = this.byId("Option1").getSelected();
				if (sOption1 === true) {
					this.byId("Product").setVisible(true);
					this.byId("ProductDescription").setVisible(true);
					this.byId("UpperProduct01").setVisible(true);
					this.byId("ValuationClass01").setVisible(true);
					this.byId("Cost01").setVisible(true);
					this.byId("UpperProduct02").setVisible(true);
					this.byId("ValuationClass02").setVisible(true);
					this.byId("Cost02").setVisible(true);
					this.byId("UpperProduct03").setVisible(true);
					this.byId("ValuationClass03").setVisible(true);
					this.byId("Cost03").setVisible(true);
					this.byId("UpperProduct04").setVisible(true);
					this.byId("ValuationClass04").setVisible(true);
					this.byId("Cost04").setVisible(true);
					this.byId("UpperProduct05").setVisible(true);
					this.byId("ValuationClass05").setVisible(true);
					this.byId("Cost05").setVisible(true);
					this.byId("UpperProduct06").setVisible(true);
					this.byId("ValuationClass06").setVisible(true);
					this.byId("Cost06").setVisible(true);
					this.byId("UpperProduct07").setVisible(true);
					this.byId("ValuationClass07").setVisible(true);
					this.byId("Cost07").setVisible(true);
					this.byId("UpperProduct08").setVisible(true);
					this.byId("ValuationClass08").setVisible(true);
					this.byId("Cost08").setVisible(true);
					this.byId("UpperProduct09").setVisible(true);
					this.byId("ValuationClass09").setVisible(true);
					this.byId("Cost09").setVisible(true);
					this.byId("UpperProduct10").setVisible(true);
					this.byId("ValuationClass10").setVisible(true);
					this.byId("Cost10").setVisible(true);
					this.byId("MaterialCost2000").setVisible(true);
					this.byId("MaterialCost3000").setVisible(true);

					this.byId("ChargeableRate").setVisible(false);
					this.byId("CurrentStockSemi").setVisible(false);
					this.byId("CurrentStockFin").setVisible(false);
					this.byId("CurrentStockTotal").setVisible(false);
					this.byId("StockChangeAmount").setVisible(false);
					this.byId("PaidMaterialCost").setVisible(false);
					this.byId("RevenueRate").setVisible(false);

				} else {
					this.byId("Product").setVisible(false);
					this.byId("ProductDescription").setVisible(false);
					this.byId("UpperProduct01").setVisible(false);
					this.byId("ValuationClass01").setVisible(false);
					this.byId("Cost01").setVisible(false);
					this.byId("UpperProduct02").setVisible(false);
					this.byId("ValuationClass02").setVisible(false);
					this.byId("Cost02").setVisible(false);
					this.byId("UpperProduct03").setVisible(false);
					this.byId("ValuationClass03").setVisible(false);
					this.byId("Cost03").setVisible(false);
					this.byId("UpperProduct04").setVisible(false);
					this.byId("ValuationClass04").setVisible(false);
					this.byId("Cost04").setVisible(false);
					this.byId("UpperProduct05").setVisible(false);
					this.byId("ValuationClass05").setVisible(false);
					this.byId("Cost05").setVisible(false);
					this.byId("UpperProduct06").setVisible(false);
					this.byId("ValuationClass06").setVisible(false);
					this.byId("Cost06").setVisible(false);
					this.byId("UpperProduct07").setVisible(false);
					this.byId("ValuationClass07").setVisible(false);
					this.byId("Cost07").setVisible(false);
					this.byId("UpperProduct08").setVisible(false);
					this.byId("ValuationClass08").setVisible(false);
					this.byId("Cost08").setVisible(false);
					this.byId("UpperProduct09").setVisible(false);
					this.byId("ValuationClass09").setVisible(false);
					this.byId("Cost09").setVisible(false);
					this.byId("UpperProduct10").setVisible(false);
					this.byId("ValuationClass10").setVisible(false);
					this.byId("Cost10").setVisible(false);
					this.byId("MaterialCost2000").setVisible(false);
					this.byId("MaterialCost3000").setVisible(false);

					this.byId("ChargeableRate").setVisible(true);
					this.byId("CurrentStockSemi").setVisible(true);
					this.byId("CurrentStockFin").setVisible(true);
					this.byId("CurrentStockTotal").setVisible(true);
					this.byId("StockChangeAmount").setVisible(true);
					this.byId("PaidMaterialCost").setVisible(true);
					this.byId("RevenueRate").setVisible(true);
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

			onCalc: function (oEvent) {
				var that = this;
				this._BusyDialog.open();
				var sOption1 = this.byId("Option1").getSelected();
				if (sOption1 === true) {
					var sType = "A";
				} else {
					var sType = "B";
				}
				var sBukrs = this.getView().byId("SFBCalculation").getControlByKey("CompanyCode").getValue();
				var sYear = new Date(this.byId("idGjahr").getValue()).getFullYear();
				var sMonat = this.byId("idMonat").getSelectedKey();
				if (sBukrs === 0 || sBukrs === "") {
					MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputBukrs"));
					return;
				}

				if (sYear === 0 || sYear === "") {
					MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputYear"));
					return;
				}

				if (sMonat === 0 || sMonat === "") {
					MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputMonat"));
					return;
				}

				var aPromise = [];
				aPromise.push(this.callAction(sType, sBukrs, sYear, sMonat));
			
				Promise.all(aPromise).then((oData) => {
					//refresh search
					oData.forEach((item) => {
						let result = JSON.parse(oData["processLogic"].Zzkey);
						result.forEach(function (line) {
							if (line.STATUS === 'S') {
								that.getView().byId("SFBCalculation").search();
								MessageBox.success(line.MESSAGE);
							} else {
								MessageBox.error(line.MESSAGE);
							}
						});

					})

				}).catch((error) => {
					MessageBox.error(error.message);
				}).finally(() => {
					this._BusyDialog.close();
				});

			},

			callAction: function (sType, sBukrs, sYear, sMonat) {
				let parts = sBukrs.split("(");
				let part = parts[1].substring(0,4);
				return new Promise(
					function (resolve, reject) {
						var mParameter = {
							success: function (oData, response) {
								resolve(oData);
							},
							error: function (oError) {
								resolve(reject);
							},
							method: "POST",
							urlParameters: {
								Zzkey: " ",
								CompanyCode: part,
								FiscalYear: sYear,
								Period: sMonat,
								Ztype: sType
							}
						};

						this.getModel().callFunction("/processLogic", mParameter);
					}.bind(this)

				);
			}
		});
	});
