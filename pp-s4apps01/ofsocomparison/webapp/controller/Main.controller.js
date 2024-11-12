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
			if(oDateRange1.getFrom()){
				var splitStart1 = `${oDateRange1.getFrom().getFullYear()}${(oDateRange1.getFrom().getMonth() + 1).toString().padStart(2,"0")}`;
				var splitEnd1 = `${oDateRange1.getTo().getFullYear()}${(oDateRange1.getTo().getMonth() + 1).toString().padStart(2,"0")}`;
			}

			if (splitStart1) {
				aFilters.push(new Filter("Duration", FilterOperator.BT,splitStart1,splitEnd1));
			}  

			var oDateRange2 = that.byId("idDateRangeSelection2");
			if(oDateRange2.getFrom()){
				var splitStart2 = `${oDateRange2.getFrom().getFullYear()}${(oDateRange2.getFrom().getMonth() + 1).toString().padStart(2,"0")}${oDateRange2.getFrom().getDate().toString().padStart(2,"0")}`;
				var splitEnd2 = `${oDateRange2.getTo().getFullYear()}${(oDateRange2.getTo().getMonth() + 1).toString().padStart(2,"0")}${oDateRange2.getTo().getDate().toString().padStart(2,"0")}`;			
			}
			
			if (splitStart2) {
				aFilters.push(new Filter("CREATED_AT", FilterOperator.BT,splitStart2,splitEnd2));
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
			Promise.all([this.readData(aFilters)]).then((results) => {
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

			oTable.addColumn(new Column({
				label: titleVariable.PeriodT1,
				template: new Text({
					text: "{local>Period1}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT2,
				template: new Text({
					text: "{local>Period2}"
				}),
				width: "10rem"
			}));		
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT3,
				template: new Text({
					text: "{local>Period3}"
				}),
				width: "10rem"
			}));		
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT4,
				template: new Text({
					text: "{local>Period4}"
				}),
				width: "10rem"
			}));	
		
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT5,
				template: new Text({
					text: "{local>Period5}"
				}),
				width: "10rem"
			}));

			oTable.addColumn(new Column({
				label: titleVariable.PeriodT6,
				template: new Text({
					text: "{local>Period6}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT7,
				template: new Text({
					text: "{local>Period7}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT8,
				template: new Text({
					text: "{local>Period8}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT9,
				template: new Text({
					text: "{local>Period9}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT10,
				template: new Text({
					text: "{local>Period10}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT11,
				template: new Text({
					text: "{local>Period11}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT12,
				template: new Text({
					text: "{local>Period12}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT13,
				template: new Text({
					text: "{local>Period13}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT14,
				template: new Text({
					text: "{local>Period14}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT15,
				template: new Text({
					text: "{local>Period15}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT16,
				template: new Text({
					text: "{local>Period16}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT17,
				template: new Text({
					text: "{local>Period17}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT18,
				template: new Text({
					text: "{local>Period18}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT19,
				template: new Text({
					text: "{local>Period19}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT20,
				template: new Text({
					text: "{local>Period20}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT21,
				template: new Text({
					text: "{local>Period21}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT22,
				template: new Text({
					text: "{local>Period22}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT23,
				template: new Text({
					text: "{local>Period23}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT24,
				template: new Text({
					text: "{local>Period24}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT25,
				template: new Text({
					text: "{local>Period25}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT26,
				template: new Text({
					text: "{local>Period26}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT27,
				template: new Text({
					text: "{local>Period27}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT28,
				template: new Text({
					text: "{local>Period28}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT29,
				template: new Text({
					text: "{local>Period29}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT30,
				template: new Text({
					text: "{local>Period30}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT31,
				template: new Text({
					text: "{local>Period31}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT32,
				template: new Text({
					text: "{local>Period32}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT33,
				template: new Text({
					text: "{local>Period33}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT34,
				template: new Text({
					text: "{local>Period34}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT35,
				template: new Text({
					text: "{local>Period35}"
				}),
				width: "10rem"
			}));
			oTable.addColumn(new Column({
				label: titleVariable.PeriodT36,
				template: new Text({
					text: "{local>Period36}"
				}),
				width: "10rem"
			}));







		},


















    });
});
