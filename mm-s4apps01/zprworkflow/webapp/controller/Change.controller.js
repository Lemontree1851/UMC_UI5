sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"./messages",
	"sap/m/MessageBox",
	"sap/ui/core/Messaging",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/m/Dialog",
	"sap/m/BusyDialog",
	"sap/suite/ui/commons/library",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",


], function (
	BaseController,
	formatter,
	messages,
	MessageBox,
	Messaging,
	MessageToast,
	Fragment,
	Dialog,
	BusyDialog,
	mobileLibrary,
	suiteLibrary,
	FilterOperator,
	Filter,
	JSONModel,


) {
	"use strict";
	// shortcut for sap.m.DialogType

	return BaseController.extend("mm.zprworkflow.controller.Change", {

		formatter: formatter,
		onInit: function (oEvent) {
			// this._BusyDialog = new BusyDialog();

			this._BusyDialog = new BusyDialog();
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oRouter = this.getRouter();
			oRouter.getRoute("PurchaseReq").attachMatched(this._onRouteMatched, this);

			this.byId('idSmartTable1').rebindTable();
			this._oDataModel.refresh(true);

			// set message model
			this.getView().setModel(Messaging.getMessageModel(), "message");

			// activate automatic message generation for complete view
			Messaging.registerObject(this.getView(), true);
			this._timeline = this.byId("idTimeline");
			this._timeline.setEnableScroll(false);
			//this._timeline.setAlignment("Left");

		},
		getMediaUrl: function (sUrlString) {
			if (sUrlString) {
				var sUrl = new URL(sUrlString);
				var iStart = sUrl.href.indexOf(sUrl.origin);
				var sPath = sUrl.href.substring(iStart + sUrl.origin.length, sUrl.href.length);
				//return "/S4" + sPath;
				return jQuery.sap.getModulePath("mm.zprworkflow") + sPath;
			} else {
				return "";
			}
		},
		_onRouteMatched: function (oEvent) {
			var oArgs, oView;

			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();

			this._InsNo = oArgs.contextPrNo;
			this._InsNo1 = oArgs.contextApplyDepart;
			this._InsNo2 = oArgs.contextPath;
			this._InsNo3 = oArgs.contextInstanceId;
			this._InsNo4 = oArgs.contextApplicationId;

			if (sap.ushell && sap.ushell.Container) {
				this._UserFullName = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				this._UserEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();

			};
			//console.log("/PurchaseReqWFSum(ApplyDepart='" + oArgs.contextApplyDepart + "',PrNo='" + oArgs.contextPrNo + "')");
			//"/PurchaseReqWFItem(guid'" + oArgs.contextPath + "')",


			oView.bindElement({
				path: "/PurchaseReqWFLink(guid'" + oArgs.contextPath + "')",
				events: {
					//change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}.bind(this)
				}
			});

			this.byId("idSmartForm").setEditable(false);
			this.byId("idPage").setShowFooter(true);
			this._bindTimelineAggregation();
			this.byId('idSmartTable1').rebindTable();
			this._oDataModel.refresh(true);
		},

		onRowActionItemPress: function (oEvent) {
			var oItem, oCtx;

			oItem = oEvent.getSource();
			oCtx = oItem.getBindingContext();
			this.getRouter().navTo("Attachments", {
				contextPath: oCtx.getProperty("UUID"),
				contextPrNo: oCtx.getProperty("PrNo")
			});
		},

		onBeforeRebindTable: function (oEvent) {

			this._oDataModel.resetChanges();
			var oFilter = oEvent.getParameter("bindingParams").filters;
			var oNewFilter, aNewFilter = [];
			oFilter.push(new sap.ui.model.Filter("PrNo", "EQ", this._InsNo));

		},
		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().getBindingContext()) {
				this.getRouter().getTargets().display("notFound");
			} else {
				// 绑定模板附件path
				let item = this.getView().getBindingContext().getProperty();
				var oUploadSet = this.byId("idUploadSet");
				// if ( item.DocumentInfoRecordDocNumber ) {
				// 	var oUploadSet = this.byId("idUploadSet");
				// 	this._bindUploadSetUrl(oUploadSet,item);
				// }
				this.getInfoRecord(item).then(function (res) {
					this._bindUploadSetUrl(oUploadSet, res);
				}.bind(this)).catch(function () {
					oUploadSet.unbindElement("Attach");
					oUploadSet.setUploadUrl();
				});
			}
		},
		onSmartFormEditToggled: function (oEvent) {
			if (oEvent.getSource().getEditable()) {
				this._LocalData.setProperty("/objectPageEditable", true);
			} else {
				this._LocalData.setProperty("/objectPageEditable", false);
			}
		},
		onButtonSavePress: function () {
			Messaging.removeAllMessages();
			this.getOwnerComponent().getModel().submitChanges({
				success: function (oData) {
					if (Messaging.getMessageModel().getData().length === 0) {
						this._LocalData.setProperty("/objectPageEditable", false);
						MessageToast.show(this._ResourceBundle.getText("msgSaveSuccessed"))
						this.byId("idUploadSet").upload();
					}
				}.bind(this),
				error: function (oError) {

				}.bind(this)
			});
		},
		onBeforeItemAdded: function (oEvent) {
			var oUploadSet = oEvent.getSource();
			var sFileName = encodeURIComponent(oEvent.getParameter("item").getFileName());
			if (oUploadSet.getUploadUrl()) {
				this._saveAttachment(oUploadSet, sFileName);
			} else {
				// 创建采购申请的文档信息记录
				var item = this.getView().getBindingContext().getObject();
				var sInfoRecordDocNumber = item.PrNo + item.PrItem.padStart(5, "0") + item.UUID.slice(-10).toUpperCase();

				this.createInfoRecord(sInfoRecordDocNumber).then(function (res) {
					this._bindUploadSetUrl(oUploadSet, res);
					this._saveAttachment(oUploadSet, sFileName);
					//同时将InfoRecordDocNumber写入采购申请中
					// var sPath = this.getView().getBindingContext().sPath;
					// this._oDataModel.setProperty(sPath + "/DocumentInfoRecordDocNumber", sInfoRecordDocNumber);
				}.bind(this));
			}

		},
		onUploadCompleted: function (oEvent) {
			oEvent.getSource().getBinding("items").refresh();
		},
		getInfoRecord: function (item) {
			var sInfoRecordDocNumber = item.PrNo + item.PrItem.padStart(5, "0") + item.UUID.slice(-10).toUpperCase();
			var oInfoRecordModel = this.getView().getModel("InfoRecord");
			const sPath = "/A_DocumentInfoRecord(DocumentInfoRecordDocType='SAT',DocumentInfoRecordDocNumber='" +
				sInfoRecordDocNumber + "',DocumentInfoRecordDocVersion='00',DocumentInfoRecordDocPart='000')";
			var promise = new Promise(function (resolve, reject) {
				var mParameters = {
					success: function (oData) {
						resolve(oData);

					}.bind(this),
					error: function (oError) {
						Messaging.removeAllMessages();
						reject();

					}.bind(this)
				};
				oInfoRecordModel.read(sPath, mParameters);
			}.bind(this));
			return promise;
		},
		createInfoRecord: function (sInfoRecordDocNumber) {
			var oInfoRecordModel = this.getView().getModel("InfoRecord");
			var postData = {
				"DocumentInfoRecordDocType": "SAT",
				"DocumentInfoRecordDocNumber": sInfoRecordDocNumber,
				"DocumentInfoRecordDocVersion": "00",
				"DocumentInfoRecordDocPart": "000"
			};
			var promise = new Promise(function (resolve, reject) {
				var mParameters = {
					success: function (oData) {
						resolve(oData);
					}.bind(this),
					error: function (oError) {

					}.bind(this)
				};
				oInfoRecordModel.create("/A_DocumentInfoRecord", postData, mParameters);
			}.bind(this));
			return promise;
		},
		onDialogPress: function () {

			if (!this.Dialog) {
				var oView = this.getView();
				if (!this.Dialog) {
					var oView = this.getView();
					if (!this.Dialog) {
						this.Dialog = Fragment.load({
							id: oView.getId(),
							name: "mm.zprworkflow.fragment.Dialog",
							controller: this
						}).then(function (oDialog) {
							this.getView().addDependent(oDialog);
							// oDialog.setModel(oView.getModel());

							return oDialog;
						}.bind(this));
					}
				}
				this.Dialog.then(function (oDialog) {
					oDialog.open();
				}.bind(this));
			}

			this.Dialog.then(function (oDialog) {
				oDialog.open();
				var oTextArea = this.byId("textArea1"); // Get the TextArea control by ID
				oTextArea.setValue("");
			}.bind(this));
		},
		onDialogRejectPress: function () {

			if (!this.DialogReject) {
				var oView = this.getView();
				if (!this.DialogReject) {
					var oView = this.getView();
					if (!this.DialogReject) {
						this.DialogReject = Fragment.load({
							id: oView.getId(),
							name: "mm.zprworkflow.fragment.DialogReject",
							controller: this
						}).then(function (oDialog) {
							this.getView().addDependent(oDialog);
							// oDialog.setModel(oView.getModel());
							return oDialog;
						}.bind(this));
					}
				}
				this.DialogReject.then(function (oDialog) {
					oDialog.open();
				}.bind(this));
			}
			this.DialogReject.then(function (oDialog) {
				oDialog.open();
				oDialog.open();
				var oTextArea = this.byId("textArea"); // Get the TextArea control by ID
				oTextArea.setValue("");
			}.bind(this));
		},
		onDialogClose: function () {

			this.byId("AnswerDialogq").close();
		},

		onDialogConfirm: function () {
			this.AcceptPRWF();
		},
		onDialogCloseReject: function () {

			this.byId("AnswerDialog").close();
		},

		onDialogConfirmReject: function () {
			this.RejectPRWF();
		},
		_bindUploadSetUrl: function (oUploadSet, item) {
			const sDocumentInfoRecordDocNumber = item.DocumentInfoRecordDocNumber;
			const sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='SAT',DocumentInfoRecordDocNumber='" +
				sDocumentInfoRecordDocNumber + "',DocumentInfoRecordDocVersion='00',DocumentInfoRecordDocPart='000')";

			oUploadSet.bindElement(sPath);

		},
		_saveAttachment: function (oUploadSet, sFileName) {
			const csrfToken = this._oDataModel.securityTokenAvailable();
			// 设置http抬头参数
			csrfToken.then(function (res) {
				oUploadSet.removeAllHeaderFields();
				oUploadSet.addHeaderField(
					new sap.ui.core.Item({ key: "x-csrf-token", text: res })
				);
				oUploadSet.addHeaderField(
					new sap.ui.core.Item({ key: "slug", text: sFileName })
				);
				oUploadSet.upload();
			});
		},
		onFileRenamed: function (oEvent) {
			var oUploadSet = oEvent.getSource();
			var sFileName = encodeURIComponent(oEvent.getParameter("item").getFileName());
			this._saveAttachment(oUploadSet, sFileName);
		},
		onBeforeItemRemoved: function (oEvent) {
			oEvent.preventDefault();
			var sUrl = oEvent.getParameter("item").getProperty("url");
			var sAttachmentUrl = this._getAttachmentUrl(sUrl);
			if (sAttachmentUrl) {
				var mParameters = {
					success: function (oData) {

					}.bind(this),
					error: function (oError) {

					}.bind(this)
				};
				this.getView().getModel("Attach").remove(sAttachmentUrl, mParameters);
			}
		},
		AcceptPRWF: function () {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("AcceptPRWF", JSON.stringify(aSelectedItems));
			this._bindTimelineAggregation();

		},
		RejectPRWF: function () {
			var aSelectedItems = this.preparePostBodyReject();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("RejectPRWF", JSON.stringify(aSelectedItems));
			this._bindTimelineAggregation();

		},
		preparePostBody: function () {
			var oTextArea = this.byId("textArea1"); // Get the TextArea control by ID
			var sValue = oTextArea.getValue(); // Retrieve the value from the TextArea
			var aData = [];
			var sTimeZone = this.getUTCOffset();
			var item = {
				"PrNo": this._InsNo,
				"ApplyDepart": this._InsNo1,
				"InstanceId": this._InsNo3,
				"ApplicationId": this._InsNo4,
				"WorkflowId": "purchaserequisition",
				"Remark": sValue,
				"UserEmail": this._UserEmail,
				"UserFullName": this._UserFullName,
				"timezone": sTimeZone
			};
			aData.push(item);

			return aData;
		},
		preparePostBodyReject: function () {
			var oTextArea = this.byId("textArea"); // Get the TextArea control by ID
			var sValue = oTextArea.getValue(); // Retrieve the value from the TextArea
			var aData = [];
			var sTimeZone = this.getUTCOffset();
			var item = {
				"PrNo": this._InsNo,
				"ApplyDepart": this._InsNo1,
				"InstanceId": this._InsNo3,
				"ApplicationId": this._InsNo4,
				"WorkflowId": "purchaserequisition",
				"Remark": sValue,
				"UserEmail": this._UserEmail,
				"UserFullName": this._UserFullName,
				"timezone": sTimeZone
			};
			aData.push(item);

			return aData;
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
						if (aDataKey[i].slice(0, 11) !== "PurchaseReq") {
							aDataKey.splice(i, 1);
						}
					}
					let result = JSON.parse(oData[sAction].Zzkey);
					this._LocalData.setProperty("/recordCheckSuccessed", false);

					if (this.byId("AnswerDialogq")) { this.byId("AnswerDialogq").close(); }
					if (this.byId("AnswerDialog")) { this.byId("AnswerDialog").close(); }
					result.forEach(function (line) {
						if (line.TYPE == 'S') {
							messages.showSuccess(line.MESSAGE);
						} else {
							messages.showError(line.MESSAGE);
						}
					}, this);


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
		onPressItems: function (evt) {
			//MessageToast.show("The TimelineItem is pressed.");
		},

		orientationChanged: function (oEvent) {
			var sKey = oEvent.getParameter("selectedItem").getProperty("key");
			this._timeline.setAxisOrientation(sKey);
		},
		onScrollbarSelected: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			this._timeline.setEnableScroll(bSelected);
			this._setMessage();

			// in production you would probably want to use something like ScrollContainer
			// but for demo purpose we want to keep it simple
			// this allows scrolling for horizontal mode without EnableScrollbar ON
			document.querySelector('section').style.overflow = "auto";
			this._bindTimelineAggregation();
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
		_bindTimelineAggregation: function () {

			var afilters = [];
			var ApplicationId = this._InsNo4.padStart(6, '0');
			var oFilter1 = new sap.ui.model.Filter("WorkflowId", sap.ui.model.FilterOperator.EQ, "purchaserequisition");
			var oFilter2 = new sap.ui.model.Filter("InstanceId", sap.ui.model.FilterOperator.EQ, this._InsNo3);
			var oFilter3 = new sap.ui.model.Filter("ApplicationId", sap.ui.model.FilterOperator.EQ, ApplicationId);
			afilters.push(oFilter1, oFilter2, oFilter3);
			this._timeline.bindAggregation("content", {
				path: "/ApprovalHistory",
				filters: afilters,
				//sorter: new sap.ui.model.Sorter("ZSEQ", true), 
				template: this.byId("idTemplateItem").clone()
			});
		},

		_timelineHasGrowing: function () {
			return this._timeline.getGrowingThreshold() !== 0;
		},
		_getAttachmentUrl: function (sUrl) {
			// 修改正则表达式以匹配前面的斜杠
			const regex = /\/AttachmentContentSet\([^)]*\)/;
			const match = sUrl.match(regex);

			if (match) {
				const result = match[0]; // 提取的部分
				return result;
			} else {
				return false;
			}
		},
		async onMessagePopoverPress(oEvent) {
			const oSourceControl = oEvent.getSource();
			const oMessagePopover = await this._getMessagePopover();
			oMessagePopover.openBy(oSourceControl);
		},
		_getMessagePopover() {
			if (!this.MessageDialog) {
				this.MessageDialog = this.loadFragment({
					name: "mm.zprworkflow.fragment.MessagePopover"
				});
			}
			return this.MessageDialog;
		},

		// ADD BEGIN BY XINLEI XU 2025/04/23 CR#4359
		onBeforeExport: function (oEvent) {
			var mExcelSettings = oEvent.getParameter("exportSettings");
			mExcelSettings.workbook.columns.forEach(function (oColumn) {
				switch (oColumn.property) {
					// Date
					case "DeliveryDate":
						oColumn.type = sap.ui.export.EdmType.Date;
						break;
				}
			});
		}
		// ADD END BY XINLEI XU 2025/04/23 CR#4359
	});
});