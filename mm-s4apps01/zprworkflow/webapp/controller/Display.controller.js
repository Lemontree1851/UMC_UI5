sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "./messages",
	"sap/ui/model/Filter",
	"sap/m/BusyDialog",
	"sap/ui/core/Fragment"
], function(
    BaseController,
    formatter,
    messages,
	Filter,
	BusyDialog,
	Fragment
) {
	"use strict";

	return BaseController.extend("mm.zprworkflow.controller.Display", {
        formatter : formatter,
        onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this._BusyDialog = new BusyDialog();
            var oRouter = this.getRouter();
			oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);
			if (sap.ushell && sap.ushell.Container) {
				this._UserFullName = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				this._UserEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
				 
			};
        },
        onRowActionItemPress : function(oEvent){
			var oItem, oCtx;

			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext();
			var InstanceId = oCtx.getProperty("InstanceId");
			// 某些情况下InstanceId会为空，但是router中不允许，所以给一个默认值
			if (!InstanceId) {
				InstanceId = "00000000-0000-0000-0000-000000000000";
			}
			this.getRouter().navTo("PurchaseReq",{
				contextPath : oCtx.getProperty("UUID"),
				contextPrNo: oCtx.getProperty("PrNo"),
				contextApplyDepart: oCtx.getProperty("ApplyDepart"),

				contextInstanceId: InstanceId,
				contextApplicationId: oCtx.getProperty("ApplicationId"),
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

		onBeforeRebindTable: function (oEvent) {
			this._oDataModel.resetChanges();
			var oFilter = oEvent.getParameter("bindingParams").filters;
			oFilter.push(new sap.ui.model.Filter("EmailAddress", "EQ", this._UserEmail));
// 			this._oDataModel.resetChanges();
 			var oFilter = oEvent.getParameter("bindingParams").filters;
 			var oNewFilter, aNewFilter = [];
			var oApplyDate = this.byId("idDatePicker").getDateValue();
			if (oApplyDate) {
				var year = oApplyDate.getFullYear();
				var month = (oApplyDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
				var day = oApplyDate.getDate().toString().padStart(2, '0');
				var formattedDate = `${year}${month}${day}`;
				if (oApplyDate) {
					console.log("ApplyDate",formattedDate)	;
				    aNewFilter.push(new Filter("ApplyDate", "EQ", formattedDate)); 
				}
			}

 			oNewFilter = new Filter({
 				filters:aNewFilter 
 			});
 			if (aNewFilter.length > 0) {
				oFilter.push(oNewFilter);
 			}
		},

		createPurchseOrder: function (oEvent) {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("createPurchaseOrder", JSON.stringify(aSelectedItems));

		},
		onAcceptPress: function (oEvent) {

			this.postAction("AcceptPRWF", JSON.stringify(aSelectedItems));

		},
		onRejectPress: function (oEvent) {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("RejectPRWF", JSON.stringify(aSelectedItems));

		},
		preparePostBody:function (stextarea) {
			//var oTextArea = this.byId("textArea1"); // Get the TextArea control by ID
			//var sValue = oTextArea.getValue(); // Retrieve the value from the TextArea
			var aData = [];
			var postDocs = [];
			// 根据id值获取table 
			var oTable = this.getView().byId("idPurchaseReqTable");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return aData;
			}
			listItems.forEach(_getData,this); //根据选择的行获取具体的数据
			function _getData(iSelected, index) { //sSelected为选中的行
				let key = oTable.getContextByIndex(iSelected).getPath();
				let lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				lineData.Remark =  stextarea;
				lineData.WorkflowId = "purchaserequisition";
				lineData.UserEmail = this._UserEmail;
				lineData.UserFullName = this._UserFullName; 
				let postData = JSON.parse(JSON.stringify(lineData));
				aData.push(postData);
			}
			return aData;
		},
 
		removeDuplicates: function(arr) {
			const map = new Map();
			arr.forEach(item => map.set(item.PrNo));
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
					var aDataKey = Object.getOwnPropertyNames(this._oDataModel.getProperty("/"));
					for (var i = aDataKey.length - 1; i >= 0; i--) {
						if (aDataKey[i].slice(0,11) !== "PurchaseReq") {
							aDataKey.splice(i, 1);
						}
					}
                    let result = JSON.parse(oData[sAction].Zzkey);
                    result.forEach(function (line) {
                        aDataKey.forEach(function(key, index){
							var lineData = this._oDataModel.getProperty("/" + key);
							if (lineData.UUID.replace(/-/g, '') === this.base64ToHex(line.UUID)) {
								// lineCount++;
								this._oDataModel.setProperty("/" + key + "/Type", line.TYPE);
								this._oDataModel.setProperty("/" + key + "/Message", line.MESSAGE);
								//this._oDataModel.setProperty("/" + key + "/ResultText", line.RESULTTEXT);
 
							}
						},this);
                    },this);
					this._BusyDialog.close();
                }.bind(this),
                error: function (oError) {
                    this._LocalData.setProperty("/recordCheckSuccessed", false);
                    messages.showError(messages.parseErrors(oError));
					this._BusyDialog.close();
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
		onDialogAcceptPress: function () {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}			
            if (!this.Dialog) {
                var oView = this.getView();
				if (!this.Dialog) {
					var oView = this.getView();
					if (!this.Dialog) {
						this.Dialog = Fragment.load({
							id: oView.getId(),
							name: "mm.zprworkflow.fragment.Dialog",
							controller: this
						}).then(function (oDialog){
							this.getView().addDependent(oDialog);
							// oDialog.setModel(oView.getModel());
							return oDialog;
						}.bind(this));
					}
				}
				this.Dialog.then(function(oDialog) {
					oDialog.open();
				}.bind(this));
            }
            this.Dialog.then(function(oDialog) {
                oDialog.open();
				var oTextArea = this.byId("textArea1"); // Get the TextArea control by ID
				oTextArea.setValue(""); 
            }.bind(this));
        },
		onDialogRejectPress: function () {	
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}		
            if (!this.DialogReject) {
                var oView = this.getView();
				if (!this.DialogReject) {
					var oView = this.getView();
					if (!this.DialogReject) {
						this.DialogReject = Fragment.load({
							id: oView.getId(),
							name: "mm.zprworkflow.fragment.DialogReject",
							controller: this
						}).then(function (oDialog){
							this.getView().addDependent(oDialog);
							// oDialog.setModel(oView.getModel());
							return oDialog;
						}.bind(this));
					}
				}
				this.DialogReject.then(function(oDialog) {
					oDialog.open();
				}.bind(this));
            }
            this.DialogReject.then(function(oDialog) {
                oDialog.open();
				var oTextArea = this.byId("textArea"); // Get the TextArea control by ID
				oTextArea.setValue(""); 
            }.bind(this));
        },
        onDialogClose: function(){

            this.byId("AnswerDialogq").close();
        },

        onDialogConfirm: function() {
			var oTextArea = this.byId("textArea1"); // Get the TextArea control by ID
			var sValue = oTextArea.getValue(); // Retrieve the value from the TextArea
			var aSelectedItems = this.preparePostBody(sValue);
			if (aSelectedItems.length === 0) {
				return;
			}
            this.postAction("AcceptPRWF", JSON.stringify(aSelectedItems));
			this.byId("AnswerDialogq").close();
        },
		onDialogCloseReject: function(){

            this.byId("AnswerDialog").close();
        },

        onDialogConfirmReject: function() {
			var oTextArea = this.byId("textArea"); // Get the TextArea control by ID
			var sValue = oTextArea.getValue(); // Retrieve the value from the TextArea
			var aSelectedItems = this.preparePostBody(sValue);
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("RejectPRWF", JSON.stringify(aSelectedItems));
			this.byId("AnswerDialog").close();
        },
		formatDate: function(date) {
			var year = date.getFullYear();
			var month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
			var day = date.getDate().toString().padStart(2, '0');
			
			return `${year}${month}${day}`;
		}

	});
});