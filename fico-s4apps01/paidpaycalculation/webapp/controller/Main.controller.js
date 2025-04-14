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
				this.getRouter().getRoute("Main").attachMatched(this._initialize, this);

			},

			_initialize: function () {
				this._UserInfo = sap.ushell.Container.getService("UserInfo");
				var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
				var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
				var oContextBinding = this.getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
					"$expand": "_AssignPlant,_AssignCompany,_AssignSalesOrg,_AssignPurchOrg,_AssignRole($expand=_UserRoleAccessBtn)"
				});
				oContextBinding.requestObject().then(function (context) {
					var aAccessBtns = [],
						aAllAccessBtns = [];
					if (context._AssignRole && context._AssignRole.length > 0) {
						context._AssignRole.forEach(role => {
							aAccessBtns.push(role._UserRoleAccessBtn);
						});
						aAllAccessBtns = aAccessBtns.flat();
					}
					if (!aAllAccessBtns.some(btn => btn.AccessId === "paidpaycalculation-View")) {
						if (!this.oErrorMessageDialog) {
							this.oErrorMessageDialog = new sap.m.Dialog({
								type: sap.m.DialogType.Message,
								state: "Error",
								content: new sap.m.Text({
									text: this.getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
								})
							});
						}
						this.oErrorMessageDialog.open();
					}
					this.getModel("local").setProperty("/authorityCheck", {
						button: {
							View: aAllAccessBtns.some(btn => btn.AccessId === "paidpaycalculation-View"),
							Material: aAllAccessBtns.some(btn => btn.AccessId === "paidpaycalculation-MaterialCalculate"),
							PurchasingGroup: aAllAccessBtns.some(btn => btn.AccessId === "paidpaycalculation-PurchGroupCalculate"),
							Calc: aAllAccessBtns.some(btn => btn.AccessId === "paidpaycalculation-Calculation")
						},
						data: {
							PlantSet: context._AssignPlant,
							CompanySet: context._AssignCompany,
							SalesOrgSet: context._AssignSalesOrg,
							PurchOrgSet: context._AssignPurchOrg,
							RoleSet: context._AssignRole
						}
					});
				}.bind(this), function (oError) {
					if (!this.oErrorMessageDialog) {
						this.oErrorMessageDialog = new sap.m.Dialog({
							type: sap.m.DialogType.Message,
							state: "Error",
							content: new sap.m.Text({
								text: this.getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
							})
						});
					}
					this.oErrorMessageDialog.open();
				}.bind(this));

			},
			onButtonSelect: function (oEvent) {
				var sOption1 = this.byId("Option1").getSelected();
				if (sOption1 === true) {
					this.getView().getModel("local").setProperty("/showA", true);
					this.getView().getModel("local").setProperty("/showB", false);
				} else {
					this.getView().getModel("local").setProperty("/showA", false);
					this.getView().getModel("local").setProperty("/showB", true);
					
				}
			},

			onAfterRendering: function (oEvent) {
				var bOption1Selected = this.byId("Option1").getSelected();
				if (bOption1Selected === true) {
					setTimeout(() => {
						this.getView().getModel("local").setProperty("/showA", true);
						this.getView().getModel("local").setProperty("/showB", false);
					}, 100);
				} else {
					setTimeout(() => {
						this.getView().getModel("local").setProperty("/showA", false);
						this.getView().getModel("local").setProperty("/showB", true);
					}, 100);
				}
				
			},

			onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
				var bHasError = false;
				var sMessage = "";
				var sBukrs = this.getView().byId("SFBCalculation").getControlByKey("CompanyCode").getValue();
				let parts = sBukrs.split("(");
				let part = parts[1].substring(0, 4);
				var aAuthorityCompanySet = this.getModel("local").getProperty("/authorityCheck/data/CompanySet");

				if (!aAuthorityCompanySet.some(data => data.CompanyCode === part)) {
					bHasError = true;
					sMessage = part;
				}

				if (bHasError) {
					MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityCompanyCode", [sMessage]));
					return;
				} else {
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

					var sLedge = this.getView().byId("idLedge").getSelectedKey();
					mBindingParams.filters.push(new sap.ui.model.Filter("Ledge", "EQ", sLedge));

				}
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
				var sLedge = this.getView().byId("idLedge").getSelectedKey();
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
				aPromise.push(this.callAction(sType, sBukrs, sYear, sMonat, sLedge));

				Promise.all(aPromise).then((oData) => {
					//refresh search
					oData.forEach((item) => {
						let result = JSON.parse(item["processLogic"].Zzkey);
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

			callAction: function (sType, sBukrs, sYear, sMonat, sLedge) {
				let parts = sBukrs.split("(");
				let part = parts[1].substring(0, 4);
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
								Zzkey: "",
								CompanyCode: part,
								FiscalYear: sYear,
								Period: sMonat,
								Ztype: sType,
								Ledge: sLedge
							}
						};

						this.getModel().callFunction("/processLogic", mParameter);
					}.bind(this)

				);
			}
		});
	});
