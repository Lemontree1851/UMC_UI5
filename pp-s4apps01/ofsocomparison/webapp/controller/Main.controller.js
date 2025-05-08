sap.ui.define([
	"./Base",
	"sap/ui/table/Column",
	"sap/m/Text",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"pp/ofsocomparison/model/formatter",
	'sap/ui/export/Spreadsheet',
], function (Base, Column, Text, MessageBox, BusyDialog, MessageToast, Filter, FilterOperator, formatter, Spreadsheet) {
	"use strict";

	return Base.extend("pp.ofsocomparison.controller.Main", {

		formatter: formatter,

		onInit: function () {
			this._BusyDialog = new BusyDialog();
			this._UserInfo = sap.ushell.Container.getService("UserInfo");
			this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
		},

		_initialize: function () {
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
				if (!aAllAccessBtns.some(btn => btn.AccessId === "ofsocomparison-View")) {
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
						View: aAllAccessBtns.some(btn => btn.AccessId === "ofsocomparison-View"),
						Export: aAllAccessBtns.some(btn => btn.AccessId === "ofsocomparison-Export")
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

		onSearch: function () {

			var that = this;

			this.getModel().resetChanges();
			var oSearchBar = this.byId("idSmartFilterBar1");
			var oTable = this.byId("tablelist");
			var aFilters = oSearchBar.getFilters();

			var sLatestOF = this.getModel("local").getProperty("/LatestOF");
			if (sLatestOF) {
				aFilters.push(new Filter("LatestOF", FilterOperator.EQ, sLatestOF));
			}

			var sContents = this.getModel("local").getProperty("/Contents");
			if (sContents) {
				aFilters.push(new Filter("Contents", FilterOperator.EQ, sContents));
			}

			var oDateRange1 = that.byId("idDateRangeSelection1");
			if (oDateRange1.getFrom()) {
				var splitStart1 = `${oDateRange1.getFrom().getFullYear()}${(oDateRange1.getFrom().getMonth() + 1).toString().padStart(2, "0")}`;
				var splitEnd1 = `${oDateRange1.getTo().getFullYear()}${(oDateRange1.getTo().getMonth() + 1).toString().padStart(2, "0")}`;
			}

			if (splitStart1) {
				aFilters.push(new Filter("Duration", FilterOperator.BT, splitStart1, splitEnd1));
			}

			var oDateRange2 = that.byId("idDateRangeSelection2");
			if (oDateRange2.getFrom()) {
				var splitStart2 = `${oDateRange2.getFrom().getFullYear()}${(oDateRange2.getFrom().getMonth() + 1).toString().padStart(2, "0")}${oDateRange2.getFrom().getDate().toString().padStart(2, "0")}`;
				var splitEnd2 = `${oDateRange2.getTo().getFullYear()}${(oDateRange2.getTo().getMonth() + 1).toString().padStart(2, "0")}${oDateRange2.getTo().getDate().toString().padStart(2, "0")}`;
			}

			if (splitStart2) {
				aFilters.push(new Filter("CREATED_AT", FilterOperator.BT, splitStart2, splitEnd2));
			}

			// ADD BEGIN BY XINLEI XU 2025/03/17
			var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
			aFilters.push(new Filter("UserEmail", FilterOperator.EQ, sEmail));
			// ADD END BY XINLEI XU 2025/03/17

			var oFilterData = oSearchBar.getFilterData();
			this.getTableContent(aFilters, oFilterData, oTable);
		},

		getTableContent: function (aFilters, oFilterData, oTable) {
			var that = this;
			// if (oFilterData.Material) {
			// 	var b = this.readProductOldID(oFilterData.Material);
			// }
			// Promise.all([this.readData(aFilters), b]).then((results) => {


			// Promise.all([this.readData(aFilters)]).then((results) => {
			this._BusyDialog.open();
			Promise.all([this.readData(aFilters)]).then((results) => {
				if (results[0].results.length > 0) {
					that.getModel("local").setProperty("/data", results[0].results);
					that.buildListResultUITable(oTable, results[0].results[0]);
					this._BusyDialog.close();
				} else {
					this._BusyDialog.close();
					MessageBox.error("対象データが無いです。");
					that.getModel("local").setProperty("/data", results[0].results);
					that.buildListResultUITable(oTable, results[0].results[0]);



				}
			}).catch((error) => {
				MessageBox.error(error);
			}).finally(() => {
				this._BusyDialog.close();
			});
		},

		readData(aFilters) {
			var that = this;
			return new Promise((resolve, reject) => {
				that.getModel().read("/OFSOCOMPARISON", {
					filters: aFilters,
					urlParameters: {
						"$top": 999999999
					},

					// urlParameters: {
					// 	"$expand": "toResults"
					// },
					success: function (oData) {
						resolve(oData);
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		buildListResultUITable: function (oTable, titleVariable) {
			if (titleVariable) {
				oTable.removeAllColumns();

				oTable.addColumn(new Column({
					label: "{i18n>Plant}",
					template: new Text({
						text: "{local>Plant}"
					}),
					width: "10rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>Customer}",
					template: new Text({
						text: "{local>Customer}"
					}),
					width: "10rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>Material}",
					template: new Text({
						text: "{local>Material}"
					}),
					width: "10rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>MaterialName}",
					template: new Text({
						text: "{local>MaterialName}"
					}),
					width: "10rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>MATERIALBYCUSTOMER}",
					template: new Text({
						text: "{local>MATERIALBYCUSTOMER}"
					}),
					width: "10rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>CREATED_AT}",
					template: new Text({
						text: "{local>CREATED_AT}"
					}),
					width: "10rem"
				}));

				if (titleVariable.PeriodT1) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT1,
						template: new Text({
							text: "{local>Period1}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT2) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT2,
						template: new Text({
							text: "{local>Period2}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT3) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT3,
						template: new Text({
							text: "{local>Period3}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT4) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT4,
						template: new Text({
							text: "{local>Period4}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT5) {

					oTable.addColumn(new Column({
						label: titleVariable.PeriodT5,
						template: new Text({
							text: "{local>Period5}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT6) {

					oTable.addColumn(new Column({
						label: titleVariable.PeriodT6,
						template: new Text({
							text: "{local>Period6}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT7) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT7,
						template: new Text({
							text: "{local>Period7}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT8) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT8,
						template: new Text({
							text: "{local>Period8}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT9) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT9,
						template: new Text({
							text: "{local>Period9}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT10) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT10,
						template: new Text({
							text: "{local>Period10}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT11) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT11,
						template: new Text({
							text: "{local>Period11}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT12) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT12,
						template: new Text({
							text: "{local>Period12}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT13) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT13,
						template: new Text({
							text: "{local>Period13}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT14) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT14,
						template: new Text({
							text: "{local>Period14}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT15) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT15,
						template: new Text({
							text: "{local>Period15}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT16) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT16,
						template: new Text({
							text: "{local>Period16}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT17) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT17,
						template: new Text({
							text: "{local>Period17}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT18) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT18,
						template: new Text({
							text: "{local>Period18}"
						}),
						width: "10rem"
					}));
				}
				if (titleVariable.PeriodT19) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT19,
						template: new Text({
							text: "{local>Period19}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT20) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT20,
						template: new Text({
							text: "{local>Period20}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT21) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT21,
						template: new Text({
							text: "{local>Period21}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT22) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT22,
						template: new Text({
							text: "{local>Period22}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT23) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT23,
						template: new Text({
							text: "{local>Period23}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT24) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT24,
						template: new Text({
							text: "{local>Period24}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT25) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT25,
						template: new Text({
							text: "{local>Period25}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT26) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT26,
						template: new Text({
							text: "{local>Period26}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT27) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT27,
						template: new Text({
							text: "{local>Period27}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT28) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT28,
						template: new Text({
							text: "{local>Period28}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT29) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT29,
						template: new Text({
							text: "{local>Period29}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT30) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT30,
						template: new Text({
							text: "{local>Period30}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT31) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT31,
						template: new Text({
							text: "{local>Period31}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT32) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT32,
						template: new Text({
							text: "{local>Period32}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT33) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT33,
						template: new Text({
							text: "{local>Period33}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT34) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT34,
						template: new Text({
							text: "{local>Period34}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT35) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT35,
						template: new Text({
							text: "{local>Period35}"
						}),
						width: "10rem"
					}));
				}

				if (titleVariable.PeriodT36) {
					oTable.addColumn(new Column({
						label: titleVariable.PeriodT36,
						template: new Text({
							text: "{local>Period36}"
						}),
						width: "10rem"
					}));
				}
			}

		},

		onDataExport: function () {
			var aCols = [],
				oSettings, oSheet;

			var oTable = this.byId("tablelist");
			var aColumns = oTable.getColumns();
			for (var column of aColumns) {
				aCols.push({
					label: column.getLabel().getText(),
					property: column.getTemplate().getBindingInfo("text").parts[0].path,
					scale: 0
				});
			}
			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: this.getModel("local").getProperty("/data")
			};
			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.finally(oSheet.destroy);
		}
















	});
});
