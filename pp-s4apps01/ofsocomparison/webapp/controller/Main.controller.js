sap.ui.define([
	"./Base",
	"sap/ui/table/Column",
	"sap/m/Text",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"pp/ofsocomparison/model/formatter",
],
function (Base, Column, Text, MessageToast, Filter, FilterOperator, formatter) {
    "use strict";

    return Base.extend("pp.ofsocomparison.controller.Main", {

        formatter: formatter,

        onInit: function () {

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
			var splitStart1 = `${oDateRange1.getFrom().getFullYear()}${(oDateRange1.getFrom().getMonth() + 1).toString().padStart(2,"0")}`;
			var splitEnd1 = `${oDateRange1.getTo().getFullYear()}${(oDateRange1.getTo().getMonth() + 1).toString().padStart(2,"0")}`;

			if (splitStart1) {
				aFilters.push(new Filter("Duration", FilterOperator.BT,splitStart1,splitEnd1));
			}  

			var oDateRange2 = that.byId("idDateRangeSelection2");
			var splitStart2 = `${oDateRange2.getFrom().getFullYear()}${(oDateRange2.getFrom().getMonth() + 1).toString().padStart(2,"0")}`;
			var splitEnd2 = `${oDateRange2.getTo().getFullYear()}${(oDateRange2.getTo().getMonth() + 1).toString().padStart(2,"0")}`;

			if (splitStart2) {
				aFilters.push(new Filter("CREATED_AT", FilterOperator.BT,splitStart2,splitEnd2));
			}   

			var oFilterData = oSearchBar.getFilterData();
			this.getTableContent(aFilters, oFilterData, oTable);
		},

		getTableContent: function (aFilters, oFilterData, oTable) {
			var that = this;
			if (oFilterData.Material) {
				var b = this.readProductOldID(oFilterData.Material);
			}
			Promise.all([this.readData(aFilters), b]).then((results) => {
				that.getModel("local").setProperty("/data", results[0].results);
				that.buildListResultUITable(oTable, results[0].results[0]);
			}).catch(() => {
			}).finally(() => {
				that.setBusy(false);
			});
		},

		readData(aFilters) {
			var that = this;
			return new Promise((resolve, reject) => {
				that.getModel().read("/OFSOCOMPARISON", {
					filters: aFilters,
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
			oTable.removeAllColumns();
			oTable.addColumn(new Column({
				label: "{i18n>Customer}",
				template: new Text({
					text: "{local>Customer}"
				}),
				width: "10rem"
			}));
			// oTable.addColumn(new Column({
			// 	label: "{i18n>CustomerName}",
			// 	template: new Text({
			// 		text: "{local>CustomerName}"
			// 	}),
			// 	width: "10rem"
			// }));
			// oTable.addColumn(new Column({
			// 	label: "{i18n>LimitAmount}",
			// 	template: new Text({
			// 		text: "{local>LimitAmount}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));
			// oTable.addColumn(new Column({
			// 	label: "{i18n>Termstext1}",
			// 	template: new Text({
			// 		text: "{local>Termstext1}"
			// 	}),
			// 	width: "10rem"
			// }));
			// oTable.addColumn(new Column({
			// 	label: "{i18n>Termstext2}",
			// 	template: new Text({
			// 		text: "{local>Termstext2}"
			// 	}),
			// 	width: "10rem"
			// }));
			// oTable.addColumn(new Column({
			// 	label: "{i18n>text}",
			// 	template: new Text({
			// 		text: "{local>text1}"
			// 	}),
			// 	width: "20rem"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth1}",
			// 	label: titleVariable.zymonth1,
			// 	template: new Text({
			// 		text: "{local>zmonth1}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth2}",
			// 	label: titleVariable.zymonth2,
			// 	template: new Text({
			// 		text: "{local>zmonth2}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth3}",
			// 	label: titleVariable.zymonth3,
			// 	template: new Text({
			// 		text: "{local>zmonth3}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth4}",
			// 	label: titleVariable.zymonth4,
			// 	template: new Text({
			// 		text: "{local>zmonth4}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth5}",
			// 	label: titleVariable.zymonth5,
			// 	template: new Text({
			// 		text: "{local>zmonth5}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth6}",
			// 	label: titleVariable.zymonth6,
			// 	template: new Text({
			// 		text: "{local>zmonth6}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth7}",
			// 	label: titleVariable.zymonth7,
			// 	template: new Text({
			// 		text: "{local>zmonth7}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth8}",
			// 	label: titleVariable.zymonth8,
			// 	template: new Text({
			// 		text: "{local>zmonth8}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth9}",
			// 	label: titleVariable.zymonth9,
			// 	template: new Text({
			// 		text: "{local>zmonth9}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth10}",
			// 	label: titleVariable.zymonth10,
			// 	template: new Text({
			// 		text: "{local>zmonth10}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth11}",
			// 	label: titleVariable.zymonth11,
			// 	template: new Text({
			// 		text: "{local>zmonth11}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));

			// oTable.addColumn(new Column({
			// 	// label: "{i18n>zmonth12}",
			// 	label: titleVariable.zymonth12,
			// 	template: new Text({
			// 		text: "{local>zmonth12}"
			// 	}),
			// 	width: "10rem",
			// 	hAlign: "End"
			// }));


		},


















    });
});
