sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"./messages",
	"../lib/xlsx",
	"sap/ui/model/Filter",
	"sap/m/BusyDialog",
	"sap/ui/core/Fragment"
], function (
	BaseController,
	formatter,
	messages,
	xlsx,
	Filter,
	BusyDialog,
	Fragment
) {
	"use strict";

	return BaseController.extend("fico.zbindglaccountlis.controller.Display", {
		formatter: formatter,
		onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this._BusyDialog = new BusyDialog();
			var oRouter = this.getRouter();
			oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);
			// *************************************************
			this.getRouter().getRoute("RouteMain").attachMatched(this._initialize, this);
		},
		_initialize: function () {
			var sUser = sap.ushell.Container.getService("UserInfo").getUser().getFullName();;
			var sEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
			var oContextBinding = this.getOwnerComponent().getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
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
				if (!aAllAccessBtns.some(btn => btn.AccessId === "zbindglaccountlist-View")) {
					if (!this.oErrorMessageDialog) {
						this.oErrorMessageDialog = new sap.m.Dialog({
							type: sap.m.DialogType.Message,
							state: "Error",
							content: new sap.m.Text({
								text: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
							})
						});
					}
					this.oErrorMessageDialog.open();
				}

			}.bind(this), function (oError) {
				// if (!this.oErrorMessageDialog) {
				// 	this.oErrorMessageDialog = new sap.m.Dialog({
				// 		type: sap.m.DialogType.Message,
				// 		state: "Error",
				// 		content: new sap.m.Text({
				// 			text: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
				// 		})
				// 	});
				// }
				// this.oErrorMessageDialog.open();
			}.bind(this));
		},
		onRowActionItemPress: function (oEvent) {
			var oItem, oCtx;

			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext();

			this.getRouter().navTo("PurchaseReq", {
				contextPath: oCtx.getProperty("UUID")
			});
		},
		_onRouteMatched: function (oEvent) {
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

		// In your Display.controller.js
		onBeforeRebindTable: function (oEvent) {
			//console.log(Filter);
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.parameters.custom = {
				rowClass: this._getRowClass
			};
			var oFilter = oEvent.getParameter("bindingParams").filters;
			var SumCheck = this.byId("idCheckbox");

			//console.log(SumCheck.getSelected());
			var oNewFilter, aNewFilter = [];
			if (SumCheck.getSelected()) {

				this.sumchecks = false;

				aNewFilter.push(new Filter("GLAccount", "EQ", "合計"));
				oNewFilter = new Filter({
					filters: aNewFilter
				});
				if (aNewFilter.length > 0) {
					oFilter.push(oNewFilter);
				}

			}
			else {
				this.sumchecks = true;
			}



		},
		_getRowClass: function (oContext) {
			// Example logic to determine the row class
			var status = oContext.getProperty("Status"); // Replace "Status" with your property
			if (status === "A") {
				return "greenRow"; // Apply green row class
			} else if (status === "B") {
				return "redRow"; // Apply red row class
			}
			return ""; // No specific class
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
					var c2Cell = aRows[i].getCells()[2];
					if (c2Cell) {
						sType = c2Cell.getText();
						if (sType === "合計" && this.sumchecks) {
							$("#" + aRows[i].getId()).css("background-color", "#FFFF00");
							$("#" + aRows[i].getId() + "-fixed").css("background-color", "#FFFF00");
						}
						else {
							$("#" + aRows[i].getId()).css("background-color", "");
							$("#" + aRows[i].getId() + "-fixed").css("background-color", "");
						}

					}
				}
			}
		},
		createPurchseOrder: function (oEvent) {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("createPurchaseOrder", JSON.stringify(aSelectedItems));

		},

		preparePostBody: function () {
			var aData = [];
			var postDocs = [];
			// 根据id值获取table 
			var oTable = this.getView().byId("idPurchaseReqTable");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return aData;
			}
			listItems.forEach(_getData, this); //根据选择的行获取具体的数据
			function _getData(iSelected, index) { //sSelected为选中的行
				let key = oTable.getContextByIndex(iSelected).getPath();
				let lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				let postData = JSON.parse(JSON.stringify(lineData));
				aData.push(postData);
			}
			return aData;
		},

		removeDuplicates: function (arr) {
			const map = new Map();
			arr.forEach(item => map.set(item.PrNo, item));
			return Array.from(map.values());
		},


		base64ToHex: function (base64) {
			const raw = atob(base64);  // Decode the base64 string
			let result = '';
			for (let i = 0; i < raw.length; i++) {
				const hex = raw.charCodeAt(i).toString(16).padStart(2, '0');
				result += hex;
			}
			return result.toLowerCase();
		},
		exportToExcel: function (oEvent) {
			// 根据id值获取table 
			var aData = [];
			var oTable = this.getView().byId("idPurchaseReqTable");
			var listItems = oTable.getSelectedIndices();

			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return aData;
			}


			//var aRows = sap.ui.getCore().byId("idSmartTable").getRows();
			//var aData = [];

			// 遍历每一行获取数据
			listItems.forEach(_getData, this); //根据选择的行获取具体的数据
			function _getData(iSelected, index) { //sSelected为选中的行
				let key = oTable.getContextByIndex(iSelected).getPath();
				let lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				let postData = JSON.parse(JSON.stringify(lineData));
				//console.log(postData);
				aData.push(postData);
			}

			// // 创建工作簿
			// var wb = XLSX.utils.book_new();
			// var ws = XLSX.utils.json_to_sheet(aData);

			// // 设置单元格的背景色
			// var range = XLSX.utils.decode_range(ws['!ref']);
			// for (var R = range.s.r; R <= range.e.r; ++R) {
			// 	for (var C = range.s.c; C <= range.e.c; ++C) {
			// 		var cell_address = XLSX.utils.encode_cell({ r: R, c: C });
			// 		if (!ws[cell_address]) continue;

			// 		// 这里可以根据需要自定义背景色
			// 		ws[cell_address].s = {
			// 			fill: {
			// 				fgColor: { argb: "FF00FF00" } // 设置背景色为黄色 
			// 			}
			// 		};
			// 	}
			// }

			// XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

			// // 导出文件
			// XLSX.writeFile(wb, "ExportedData.xlsx");

			const ExcelJS = require('exceljs');

			// 创建工作簿
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Sheet1');

			// 添加数据
			worksheet.addRow(aData);

			// 设置单元格的背景色
			for (let row = 1; row <= worksheet.lastRow.number; row++) {
				for (let col = 1; col <= worksheet.lastColumn.number; col++) {
					const cell = worksheet.getCell(row, col);
					cell.fill = {
						type: 'pattern',
						pattern: 'solid',
						fgColor: { argb: 'FF00FF00' } // 设置背景色为绿色
					};
				}
			}

			// 导出文件
			workbook.xlsx.writeFile('ExportedData.xlsx');


		}

	});
});