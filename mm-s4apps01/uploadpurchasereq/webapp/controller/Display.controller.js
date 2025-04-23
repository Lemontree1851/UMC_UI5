sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"./messages",
	"sap/ui/model/Filter",
	"sap/m/BusyDialog"
], function (
	BaseController,
	formatter,
	messages,
	Filter,
	BusyDialog
) {
	"use strict";

	return BaseController.extend("mm.uploadpurchasereq.controller.Display", {
		formatter: formatter,

		onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._oWorkFlow = this.getOwnerComponent().getModel("WorkFlow");

			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this._BusyDialog = new BusyDialog();
			var oRouter = this.getRouter();
			oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);
		},

		onRowActionItemPress: function (oEvent) {
			this._oDataModel.resetChanges();
			var oItem, oCtx;

			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext();
			oCtx.getProperty("InstanceId")
			var InstanceId = oCtx.getProperty("InstanceId");
			// 某些情况下InstanceId会为空，但是router中不允许，所以给一个默认值
			if (!InstanceId) {
				InstanceId = "00000000-0000-0000-0000-000000000000";
			}
			this.getRouter().navTo("PurchaseReq", {
				contextPath: oCtx.getProperty("UUID"),
				contextPrNo: oCtx.getProperty("PrNo"),
				contextApplyDepart: oCtx.getProperty("ApplyDepart"),
				contextInstanceId: InstanceId,
				contextApplicationId: oCtx.getProperty("ApplicationId"),
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
			this._UserInfo = sap.ushell.Container.getService("UserInfo");
		},

		onBeforeRebindTable: function (oEvent) {
			this._oDataModel.resetChanges();
			var oFilter = oEvent.getParameter("bindingParams").filters;

			// DEL BEGIN BY XINLEI XU 2025/04/21 CR#4359
			// var oNewFilter, aNewFilter = [];
			// var oCreatedAt = this.byId("idDatePicker").getDateValue();
			// if (oCreatedAt) {
			// 	aNewFilter.push(new Filter("CreatedAt", "EQ", formatter.convertLocalDateToUTCDate(oCreatedAt))); 
			// }

			// var sApproveStatus = this.byId("idApproveStatusSelect").getSelectedKey();
			// if(sApproveStatus !== "0") {
			// 	aNewFilter.push(new Filter("ApproveStatus", "EQ", sApproveStatus)); 
			// }

			// oNewFilter = new Filter({
			// 	filters:aNewFilter,
			// 	and:true
			// });
			// if (aNewFilter.length > 0) {
			// 	oFilter.push(oNewFilter);
			// }
			// DEL END BY XINLEI XU 2025/04/21 CR#4359

			// ADD BEGIN BY XINLEI XU 2025/04/22 CR#4359
			var sApproveStatus = this.byId("idViewRange").getSelectedKey();
			if (sApproveStatus === "1") {
				var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
				oFilter.push(new Filter("CreatedByUserEmail", "EQ", sEmail));
			}
			// ADD END BY XINLEI XU 2025/04/22 CR#4359
		},

		createPurchseOrder: function (oEvent) {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("createPurchaseOrder", JSON.stringify(aSelectedItems));
		},

		// ADD BEGIN BY XINLEI XU 2025/04/22 CR#4359
		deletePR: function () {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("deletePR", JSON.stringify(aSelectedItems));
		},
		// ADD END BY XINLEI XU 2025/04/22 CR#4359

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
			arr.forEach(item => {
				const key = `${item.PrNo}`;
				map.set(key, item);
			});
			return Array.from(map.values());
		},

		postAction: function (sAction, postData) {
			this._BusyDialog.open();
			var oModel = this._oDataModel;
			oModel.callFunction(`/${sAction}`, {
				method: "POST",
				// groupId: "myId",//如果设置groupid，会多条一起进入action
				changeSetId: 1,
				//建议只传输前端修改的参数，其他字段从后端获取
				urlParameters: {
					Event: sAction,
					Zzkey: postData
				},
				success: function (oData) {
					// ADD BEGIN BY XINLEI XU 2025/04/22 CR#4359
					if (sAction === "deletePR") {
						if (oData.deletePR.Zzkey === 'S') {
							messages.showSuccess(this._ResourceBundle.getText("DeletePRSuccess"));
						} else {
							messages.showError(this._ResourceBundle.getText("DeletePRError"));
						}
					}
					// ADD END BY XINLEI XU 2025/04/22 CR#4359
					else {
						var aDataKey = Object.getOwnPropertyNames(this._oDataModel.getProperty("/"));
						for (var i = aDataKey.length - 1; i >= 0; i--) {
							if (aDataKey[i].slice(0, 11) !== "PurchaseReq") {
								aDataKey.splice(i, 1);
							}
						}
						let result = JSON.parse(oData[sAction].Zzkey);
						result.forEach(function (line) {
							aDataKey.forEach(function (key, index) {
								var lineData = this._oDataModel.getProperty("/" + key);
								if (lineData.UUID.replace(/-/g, '') === this.base64ToHex(line.UUID)) {
									// lineCount++;
									this._oDataModel.setProperty("/" + key + "/Type", line.TYPE);
									this._oDataModel.setProperty("/" + key + "/Message", line.MESSAGE);
									this._oDataModel.setProperty("/" + key + "/PurchaseOrder", line.PURCHASEORDER);
									this._oDataModel.setProperty("/" + key + "/PurchaseOrderItem", line.PURCHASEORDERITEM.toString());
									this._oDataModel.setProperty("/" + key + "/ApproveStatus", line.APPROVESTATUS);
								}
							}, this);
						}, this);
					}
					this._BusyDialog.close();
					this.getModel().refresh();
				}.bind(this),
				error: function (oError) {
					if (sAction !== "deletePR") { // ADD BY XINLEI XU 2025/04/22 CR#4359
						this._LocalData.setProperty("/recordCheckSuccessed", false);
					}
					messages.showError(messages.parseErrors(oError));
					this._BusyDialog.close();
					this.getModel().refresh();
				}.bind(this)
			});
			// oModel.submitChanges({ groupId: "myId" });
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

		applicationApproval: function () {
			var aSelectedItems = this.prepareWorkFlowPostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postWorkFlowAction("Application", JSON.stringify(aSelectedItems));
		},

		revokeApproval: function () {
			var aSelectedItems = this.prepareWorkFlowPostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postWorkFlowAction("Revoke", JSON.stringify(aSelectedItems));
		},

		postWorkFlowAction: function (sAction, postData) {
			this._BusyDialog.open();
			var oModel = this._oWorkFlow;
			oModel.callFunction(`/${sAction}`, {
				method: "POST",
				// groupId: "myId",//如果设置groupid，会多条一起进入action
				changeSetId: 1,
				//建议只传输前端修改的参数，其他字段从后端获取
				urlParameters: {
					Event: sAction,
					Zzkey: postData
				},
				success: function (oData) {
					var aDataKey = Object.getOwnPropertyNames(this._oDataModel.getProperty("/"));
					for (var i = aDataKey.length - 1; i >= 0; i--) {
						if (aDataKey[i].slice(0, 11) !== "PurchaseReq") {
							aDataKey.splice(i, 1);
						}
					}
					let result = JSON.parse(oData[sAction].Zzkey);
					result.forEach(function (line) {
						aDataKey.forEach(function (key, index) {
							var lineData = this._oDataModel.getProperty("/" + key);
							if (lineData.PrNo === line.PRNO) {
								// lineCount++;
								this._oDataModel.setProperty("/" + key + "/Type", line.TYPE);
								this._oDataModel.setProperty("/" + key + "/Message", line.MESSAGE);
								this._oDataModel.setProperty("/" + key + "/ApproveStatus", line.APPROVESTATUS);
								this._oDataModel.setProperty("/" + key + "/ApproveStatusText", line.APPROVESTATUSTEXT);
								this._oDataModel.setProperty("/" + key + "/WorkflowId", line.WORKFLOWID);
								this._oDataModel.setProperty("/" + key + "/InstanceId", line.INSTANCEID);
								this._oDataModel.setProperty("/" + key + "/ApplyDate", line.APPLYDATE);
								this._oDataModel.setProperty("/" + key + "/ApplyTime", line.APPLYTIME);
							}
						}, this);
					}, this);
					this._BusyDialog.close();
					this.getModel().refresh();
				}.bind(this),
				error: function (oError) {
					messages.showError(messages.parseErrors(oError));
					this._BusyDialog.close();
					this.getModel().refresh();
				}.bind(this)
			});
		},
		prepareWorkFlowPostBody: function () {
			var aData = [];
			var postDocs = [];
			// 根据id值获取table 
			var oTable = this.getView().byId("idPurchaseReqTable");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return aData;
			}
			var sUser = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
			var sEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
			var sTimeZone = this.getUTCOffset();
			listItems.forEach(_getData, this); //根据选择的行获取具体的数据
			function _getData(iSelected, index) { //sSelected为选中的行
				let key = oTable.getContextByIndex(iSelected).getPath();
				let lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				let postData = JSON.parse(JSON.stringify(lineData));
				postData.userfullname = sUser;
				postData.useremail = sEmail;
				postData.timezone = sTimeZone;
				aData.push(postData);
			}
			return this.removeDuplicates(aData);
		},
		getUTCOffset: function () {
			const date = new Date();
			const offsetMinutes = -date.getTimezoneOffset(); // 与 UTC 的分钟偏移量
			const hours = Math.floor(offsetMinutes / 60);
			const minutes = Math.abs(offsetMinutes % 60);

			// 格式化为简短 UTC±HHMM 格式
			const sign = hours >= 0 ? '+' : '-';
			const formattedOffset = minutes === 0
				? `UTC${sign}${Math.abs(hours)}`
				: `UTC${sign}${Math.abs(hours)}${minutes}`;
			return formattedOffset;
		},

		onBeforeExport: function (oEvent) {
			var mExcelSettings = oEvent.getParameter("exportSettings");
			mExcelSettings.workbook.columns.forEach(function (oColumn) {
				switch (oColumn.property) {
					// Date
					case "DeliveryDate":
					case "ApplyDate":
						oColumn.type = sap.ui.export.EdmType.Date;
						break;
				}
			});
		},
	});
});