sap.ui.define([
	"./Base",
	"sap/ui/table/Column",
	"sap/m/Text",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sd/creditmantablen/model/formatter",
], function (Base, Column, Text,MessageBox,BusyDialog,MessageToast, Filter, FilterOperator, formatter) {
	"use strict";

	return Base.extend("sd.creditmantablen.controller.Main", {

		formatter: formatter,

		onInit: function () {
			this._BusyDialog = new BusyDialog();

		},

		onSearch: function () {
			this.getModel().resetChanges();
			var oSearchBar = this.byId("idSmartFilterBar1");
			var oTable = this.byId("tablelist");
			var aFilters = oSearchBar.getFilters();

			var sYear = this.getModel("local").getProperty("/dateValue");
			if (sYear) {
				aFilters.push(new Filter("zyear", FilterOperator.EQ, sYear.getFullYear()));
			}

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
				that.getModel().read("/CREDITMANTABLE", {
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
					label: "{i18n>Customer}",
					template: new Text({
						text: "{local>Customer}"
					}),
					width: "8rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>CustomerName}",
					template: new Text({
						text: "{local>CustomerName}"
					}),
					width: "30rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>LimitAmount}",
					template: new Text({
						text: "{local>LimitAmount}"
					}),
					width: "6rem",
					hAlign: "End"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>Termstext1}",
					template: new Text({
						text: "{local>Termstext1}"
					}),
					width: "8rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>Termstext2}",
					template: new Text({
						text: "{local>Termstext2}"
					}),
					width: "12rem"
				}));
				oTable.addColumn(new Column({
					label: "{i18n>text}",
					template: new Text({
						text: "{local>text1}"
					}),
					width: "20rem"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth1}",
					label: titleVariable.zymonth1,
					template: new Text({
						text: "{local>zmonth1}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth2}",
					label: titleVariable.zymonth2,
					template: new Text({
						text: "{local>zmonth2}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth3}",
					label: titleVariable.zymonth3,
					template: new Text({
						text: "{local>zmonth3}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth4}",
					label: titleVariable.zymonth4,
					template: new Text({
						text: "{local>zmonth4}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth5}",
					label: titleVariable.zymonth5,
					template: new Text({
						text: "{local>zmonth5}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth6}",
					label: titleVariable.zymonth6,
					template: new Text({
						text: "{local>zmonth6}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth7}",
					label: titleVariable.zymonth7,
					template: new Text({
						text: "{local>zmonth7}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth8}",
					label: titleVariable.zymonth8,
					template: new Text({
						text: "{local>zmonth8}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth9}",
					label: titleVariable.zymonth9,
					template: new Text({
						text: "{local>zmonth9}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth10}",
					label: titleVariable.zymonth10,
					template: new Text({
						text: "{local>zmonth10}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth11}",
					label: titleVariable.zymonth11,
					template: new Text({
						text: "{local>zmonth11}"
					}),
					width: "10rem",
					hAlign: "End"
				}));

				oTable.addColumn(new Column({
					// label: "{i18n>zmonth12}",
					label: titleVariable.zymonth12,
					template: new Text({
						text: "{local>zmonth12}"
					}),
					width: "10rem",
					hAlign: "End"
				}));
		    }

		},

		buildMonthlyColumnsOfUITable: function (oTable) {
			var oSearchBar = this.byId("smartFilterBarlist");
			// 获取Date构建Column
			var oDateControl = oSearchBar.getControlByKey("Date");
			var oDate = oDateControl.getDateValue();

			// Get StartDate
			// var oStartDate = new Date(oDate.getFullYear(), oDate.getMonth(), 1)
			// 以选择日为第一个日期
			var oStartDate = new Date(oDate.valueOf());

			oStartDate.setDate(oStartDate.getDate() - 1);
			// Get EndDate
			var oEndDate = null;
			if (oDate.getDate() === 1) {
				oEndDate = new Date(oDate.getFullYear(), oDate.getMonth() + 1, 0);
			} else {
				oEndDate = new Date(oDate.valueOf());
				oEndDate.setDate(oEndDate.getDate() + 30);
			}

			// Get Day diff
			const oneDay = 24 * 60 * 60 * 1000;
			var diffDays = Math.round(Math.abs((oEndDate - oStartDate) / oneDay));
			for (var i = 0; i < diffDays; i++) {
				oStartDate.setDate(oStartDate.getDate() + 1);
				var sCurrDate = this.formatter.formatDate(oStartDate);
				oTable.addColumn(new Column({
					label: sCurrDate,
					template: new Text({
						// text: `{local>${sCurrDate}}`,
						text: {
							path: `local>${sCurrDate}`
							// formatter: this.formatter.formatFloatWithoutDig
						}
					}),
					width: "5.5rem",
					hAlign: "End"
				}));
			}
		},
		onUITableRowsUpdated: function (oEvent) {
			var oTable = oEvent.getSource();
			var aRows = oTable.getRows();
			var sType = "";
			var oContext = null;
			var oRowData = null;
			if (aRows && aRows.length > 0) {
				var pRow = {};
				for (var i = 0; i < aRows.length; i++) {
					// // 第一行加颜色
					// var c2Cell = aRows[i].getCells()[2];
					// if (c2Cell) {
					// 	sType = c2Cell.getText();
					// 	if (sType === "発注" || sType === 'PO Quantity') {
					// 		$("#" + aRows[i].getId()).css("background-color", "#00FFFF");
					// 		$("#" + aRows[i].getId() + "-fixed").css("background-color", "#00FFFF");
					// 	} else if (sType === "受注" || sType === 'Total SO Quantity') {
					// 		$("#" + aRows[i].getId()).css("background-color", "#FFFF00");
					// 		$("#" + aRows[i].getId() + "-fixed").css("background-color", "#FFFF00");
					// 	} else {
					// 		$("#" + aRows[i].getId()).css("background-color", "");
					// 		$("#" + aRows[i].getId() + "-fixed").css("background-color", "");
					// 	}
					// }
					// 第一列加颜色
					// var cCell = aRows[i].getCells()[0];
					// if (cCell) {
					// 	oContext = aRows[i].getBindingContext("local");
					// 	if (oContext) {
					// 		oRowData = oContext.getObject();
					// 		if (oRowData.Category === "MM") {
					// 			$("#" + aRows[i].getId() + "-col0").css("background-color", "#00FFFF");
					// 		} else {
					// 			$("#" + aRows[i].getId() + "-col0").css("background-color", "#FFFF00");
					// 		}
					// 	}

					// }
					if (i > 0) {
						// var pCell = pRow.getCells()[0],
						//     cCell = aRows[i].getCells()[0],
						// 	c1Cell = aRows[i].getCells()[1];

						var pCell = pRow.getCells()[0],
							cCell = aRows[i].getCells()[0],
							c1Cell = aRows[i].getCells()[1];
						if (pCell && cCell) {
							if (cCell.getText() === pCell.getText()) {
								$("#" + cCell.getId()).css("visibility", "hidden");
								$("#" + pRow.getId() + "-col0").css("border-bottom-style", "hidden");
							} else {
								$("#" + cCell.getId()).removeAttr("style");
								$("#" + pRow.getId() + "-col0").css("border-bottom-style", "");
							}
						}
						if (c1Cell) {
							if (!c1Cell.getText()) {
								$("#" + pRow.getId() + "-col1").css("border-bottom-style", "hidden");
							} else {
								$("#" + pRow.getId() + "-col1").css("border-bottom-style", "");
							}
						}
						var pCell = pRow.getCells()[1],
							cCell = aRows[i].getCells()[1],
							c1Cell = aRows[i].getCells()[2];
						if (pCell && cCell) {
							if (cCell.getText() === pCell.getText()) {
								$("#" + cCell.getId()).css("visibility", "hidden");
								$("#" + pRow.getId() + "-col1").css("border-bottom-style", "hidden");
							} else {
								$("#" + cCell.getId()).removeAttr("style");
								$("#" + pRow.getId() + "-col1").css("border-bottom-style", "");
							}
						}
						if (c1Cell) {
							if (!c1Cell.getText()) {
								$("#" + pRow.getId() + "-col2").css("border-bottom-style", "hidden");
							} else {
								$("#" + pRow.getId() + "-col2").css("border-bottom-style", "");
							}
						}
						var pCell = pRow.getCells()[2],
							cCell = aRows[i].getCells()[2],
							c1Cell = aRows[i].getCells()[3];
						if (pCell && cCell) {
							if (cCell.getText() === pCell.getText()) {
								$("#" + cCell.getId()).css("visibility", "hidden");
								$("#" + pRow.getId() + "-col2").css("border-bottom-style", "hidden");
							} else {
								$("#" + cCell.getId()).removeAttr("style");
								$("#" + pRow.getId() + "-col2").css("border-bottom-style", "");
							}
						}
						if (c1Cell) {
							if (!c1Cell.getText()) {
								$("#" + pRow.getId() + "-col3").css("border-bottom-style", "hidden");
							} else {
								$("#" + pRow.getId() + "-col3").css("border-bottom-style", "");
							}
						}
						var pCell = pRow.getCells()[3],
							cCell = aRows[i].getCells()[3],
							c1Cell = aRows[i].getCells()[4];
						if (pCell && cCell) {
							if (cCell.getText() === pCell.getText()) {
								$("#" + cCell.getId()).css("visibility", "hidden");
								$("#" + pRow.getId() + "-col3").css("border-bottom-style", "hidden");
							} else {
								$("#" + cCell.getId()).removeAttr("style");
								$("#" + pRow.getId() + "-col3").css("border-bottom-style", "");
							}
						}
						if (c1Cell) {
							if (!c1Cell.getText()) {
								$("#" + pRow.getId() + "-col4").css("border-bottom-style", "hidden");
							} else {
								$("#" + pRow.getId() + "-col4").css("border-bottom-style", "");
							}
						}
						var pCell = pRow.getCells()[4],
							cCell = aRows[i].getCells()[4],
							c1Cell = aRows[i].getCells()[5];
						if (pCell && cCell) {
							if (cCell.getText() === pCell.getText()) {
								$("#" + cCell.getId()).css("visibility", "hidden");
								$("#" + pRow.getId() + "-col4").css("border-bottom-style", "hidden");
							} else {
								$("#" + cCell.getId()).removeAttr("style");
								$("#" + pRow.getId() + "-col4").css("border-bottom-style", "");
							}
						}
						if (c1Cell) {
							if (!c1Cell.getText()) {
								$("#" + pRow.getId() + "-col5").css("border-bottom-style", "hidden");
							} else {
								$("#" + pRow.getId() + "-col5").css("border-bottom-style", "");
							}
						}
					}
					pRow = aRows[i];
				}
			}
		}
	});
});
