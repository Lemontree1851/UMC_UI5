sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"./messages",
	"sap/m/MessageBox",
	"sap/ui/core/Messaging",
	"sap/m/MessageToast"
], function (
	BaseController,
	formatter,
	messages,
	MessageBox,
	Messaging,
	MessageToast
) {
	"use strict";

	return BaseController.extend("mm.uploadpurchasereq.controller.Change", {
		formatter: formatter,
		onInit: function () {
			// this._BusyDialog = new BusyDialog();
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oRouter = this.getRouter();
			oRouter.getRoute("PurchaseReq").attachMatched(this._onRouteMatched, this);
			// oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);

			// set message model
			this.getView().setModel(Messaging.getMessageModel(), "message");

			// activate automatic message generation for complete view
			Messaging.registerObject(this.getView(), true);

			this._timeline = this.byId("idTimeline");
			this._timeline.setEnableScroll(false);
		},
		getMediaUrl: function (sUrlString) {
			if (sUrlString) {
				var sUrl = new URL(sUrlString);
				var iStart = sUrl.href.indexOf(sUrl.origin);
				var sPath = sUrl.href.substring(iStart + sUrl.origin.length, sUrl.href.length);
				//return "/S4" + sPath;
				return jQuery.sap.getModulePath("mm.uploadpurchasereq") + sPath;
			} else {
				return "";
			}
		},
		_onRouteMatched: function (oEvent) {
			var oArgs, oView;

			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			this._InsNo3 = oArgs.contextInstanceId;
			this._InsNo4 = oArgs.contextApplicationId;
			oView.bindElement({
				path: "/PurchaseReq(guid'" + oArgs.contextPath + "')",
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}.bind(this)
				}
			});
			this.byId("idSmartForm").setEditable(false);
			this.byId("idPage").setShowFooter(false);
			this._bindTimelineAggregation();
		},

		// 应该在未保存返回时提醒，但目前如果使用launchPad自带的返回无法终止导航，所以暂时没有使用
		// _onBeforeRouteMatched: function (oEvent) {
		// 	// 检查是否允许导航
		// 	if (!this._isNavigationAllowed()) {
		// 		oEvent.preventDefault(); // 阻止导航
		// 		// 例如：弹出提示框
		// 		MessageBox.confirm("您有未保存的更改，是否继续离开？", {
		// 			onClose: function (sAction) {
		// 				if (sAction === MessageBox.Action.OK) {
		// 					this.getOwnerComponent().getRouter().navTo(oEvent.getParameter("name"));
		// 				}
		// 			}.bind(this)
		// 		});
		// 	}
		// },
		// _isNavigationAllowed: function () {
		// 	var a = 12;
		// 	return !this.getView().getModel().hasPendingChanges();
		// },
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
			this.getView().getElementBinding().refresh();
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
		_bindUploadSetUrl: function (oUploadSet, item) {
			const sDocumentInfoRecordDocNumber = item.DocumentInfoRecordDocNumber;
			const sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='SAT',DocumentInfoRecordDocNumber='" +
				sDocumentInfoRecordDocNumber + "',DocumentInfoRecordDocVersion='00',DocumentInfoRecordDocPart='000')";
			oUploadSet.bindElement(sPath);
			// 设置uploadUrl
			const sUploadUrl = this.getView().getModel("Attach").sServiceUrl + "/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='SAT',DocumentInfoRecordDocNumber='" +
				sDocumentInfoRecordDocNumber + "',DocumentInfoRecordDocVersion='00',DocumentInfoRecordDocPart='000')/DocumentInfoRecordToAttachmentNavigation";
			oUploadSet.setUploadUrl(sUploadUrl);
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
					name: "mm.uploadpurchasereq.fragment.MessagePopover"
				});
			}

			return this.MessageDialog;
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
		_bindTimelineAggregation: function () {

			var afilters = [];
			var ApplicationId = "00" + this._InsNo4;
			var oFilter1 = new sap.ui.model.Filter("WorkflowId", sap.ui.model.FilterOperator.EQ, "purchaserequisition");
			var oFilter2 = new sap.ui.model.Filter("InstanceId", sap.ui.model.FilterOperator.EQ, this._InsNo3);
			var oFilter3 = new sap.ui.model.Filter("ApplicationId", sap.ui.model.FilterOperator.EQ, ApplicationId);
			afilters.push(oFilter1);
			afilters.push(oFilter2);

			afilters.push(oFilter3);
			this._timeline.bindAggregation("content", {
				path: "/ApprovalHistory",
				filters: afilters,
				template: this.byId("idTemplateItem").clone()
			});
		},

		_timelineHasGrowing: function () {
			return this._timeline.getGrowingThreshold() !== 0;
		},
	});
});