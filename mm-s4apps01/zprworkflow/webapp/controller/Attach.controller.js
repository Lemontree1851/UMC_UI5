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
	suiteLibrary,
	FilterOperator,
	Filter,
	JSONModel
) {
	"use strict";

	return BaseController.extend("mm.zprworkflow.controller.Attach", {

		formatter: formatter,
		onInit: function (oEvent) {
			// this._BusyDialog = new BusyDialog();
			var TimelineFilterType = suiteLibrary.TimelineFilterType;
			this._BusyDialog = new BusyDialog();
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oRouter = this.getRouter();
			oRouter.getRoute("Attachments").attachMatched(this._onRouteMatched, this);

			this._oDataModel.refresh(true);
			// oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);

			// set message model
			this.getView().setModel(Messaging.getMessageModel(), "message");

			// activate automatic message generation for complete view
			Messaging.registerObject(this.getView(), true);


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
			//this._InsNo1 = oArgs.contextApplyDepart;
			this._InsNo2 = oArgs.contextPath;

			if (sap.ushell && sap.ushell.Container) {
				this._UserFullName = sap.ushell.Container.getService("UserInfo").getUser().getFullName();
				this._UserEmail = sap.ushell.Container.getService("UserInfo").getUser().getEmail();

			};
			oView.bindElement({
				path: "/PurchaseReqWFLink(guid'" + oArgs.contextPath + "')",
				events: {
					change: this._onBindingChange.bind(this), // DEL BY XINLEI XU 2025/02/24
					dataRequested: function (oEvent) {
						oView.setBusy(true);
					},
					dataReceived: function (oEvent) {
						oView.setBusy(false);
					}.bind(this)
				}
			});
			// ADD BEGIN BY XINLEI XU 2025/02/24
			oView.setBusy(true);
			this._CallODataV2("READ", "/PurchaseReqWFLink(guid'" + oArgs.contextPath + "')/to_Attachment", [], {
			}, {}).then(function (oResponse) {
				if (oResponse) {
					var aUploadFiles = [];
					var aAttachments = oResponse.results;
					aAttachments.sort(function (a, b) {
						return a.FileSeq - b.FileSeq;
					});
					aAttachments.forEach(item => {
						aUploadFiles.push({
							"prUUID": item.PrUuid,
							"fileUUID": item.FileUuid,
							"fileSeq": item.FileSeq,
							"fileType": item.FileType,
							"fileName": item.FileName,
							"fileSize": item.FileSize,
							"s3FileName": item.S3Filename,
							"lastModifiedBy": item.LastChangedBy + " (" + item.LastChangedByName + ")",
							"lastModifiedAt": item.LastChangedAt
						});
					});
					this._LocalData.setProperty("/uploadFiles", aUploadFiles);
					this._LocalData.setProperty("/uploadFilesLen", aUploadFiles.length);
				}
				oView.setBusy(false);
			}.bind(this)), function (oError) {
				oView.setBusy(false);
			};
			// ADD END BY XINLEI XU 2025/02/24
		},
		_onRouteMatched1: function (oEvent) {
			this.getView().getModel().resetChanges();

		},


		onBeforeRebindTable: function (oEvent) {


		},
		_onBindingChange: function (oEvent) {
			// No data for the binding
			if (!this.getView().getBindingContext()) {
				this.getRouter().getTargets().display("notFound");
			} else {
				// 绑定模板附件path
				let item = this.getView().getBindingContext().getProperty();
				var oUploadSet = this.byId("idUploadSetAttach");
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


		_bindUploadSetUrl: function (oUploadSet, item) {
			const sDocumentInfoRecordDocNumber = item.DocumentInfoRecordDocNumber;
			const sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='SAT',DocumentInfoRecordDocNumber='" +
				sDocumentInfoRecordDocNumber + "',DocumentInfoRecordDocVersion='00',DocumentInfoRecordDocPart='000')";
			console.log(sPath);

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

		base64ToHex: function (base64) {
			const raw = atob(base64);  // Decode the base64 string
			let result = '';
			for (let i = 0; i < raw.length; i++) {
				const hex = raw.charCodeAt(i).toString(16).padStart(2, '0');
				result += hex;
			}
			return result.toLowerCase();
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

		// ADD BEGIN BY XINLEI XU 2025/02/24
		onDownloadFiles: function (oEvent) {
			var oRow = oEvent.getSource().getParent().getParent().getParent();
			var sPath = oRow.oBindingContexts.local.sPath;
			var oFile = this._LocalData.getProperty(sPath);
			this._CallODataV2("ACTION", "/handleFile", [], {
				"Event": "DOWNLOAD",
				"Zzkey": JSON.stringify(oFile),
				"RecordUUID": ""
			}, {}).then(function (oResponse) {
				if (oResponse.handleFile.Zzkey === "E") {
					MessageToast.show(this._ResourceBundle.getText("DownloadFileFailed"));
				} else {
					var oDownloadObject = JSON.parse(oResponse.handleFile.Zzkey);
					// Base64 => Blob
					var byteCharacters = atob(oDownloadObject.VALUE);
					var bytes = new Uint8Array(byteCharacters.length);
					for (let i = 0; i < byteCharacters.length; i++) {
						bytes[i] = byteCharacters.charCodeAt(i);
					}
					var blob = new Blob([bytes.buffer], {
						type: oDownloadObject.FILE_TYPE
					});
					var oDownLoad = document.createElement("a");
					oDownLoad.href = window.URL.createObjectURL(blob);
					oDownLoad.download = oDownloadObject.FILE_NAME;
					oDownLoad.click();
				}
			}.bind(this)), function (oError) {
				MessageToast.show(this._ResourceBundle.getText("DownloadFileFailed"));
			}.bind(this);
		}
	});
});