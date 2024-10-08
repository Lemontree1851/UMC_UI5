/**
 * 消息处理
 **/
sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (MessageBox, MessageToast) {

	"use strict";

	return {

		// DEEP交互返回错误消息处理
		parseErrors: function (oError) {
			var messages = "",
				exceptions = [],
				i;
			try {
				var response = JSON.parse(oError.responseText);
				var errordetails = response.error.innererror.errordetails;
				for (i = 0; i < errordetails.length; i++) {
					if (errordetails[i].target === "exceptions") {
						exceptions = JSON.parse(errordetails[i].message).EXCEPTIONS;
						break;
					}
				}
				if (exceptions.length === 0) {
					messages = messages + errordetails[errordetails.length - 1].message + "，\n";
				} else {
					for (i = 0; i < exceptions.length; i++) {
						messages += (exceptions[i].Message + "，\n");
					}
				}
			} catch (err) {
				messages = oError.statusCode + "：" + oError.statusText + "\n" + oError.message + "，\n";
			} finally {
				return messages.slice(0, messages.length - 2);
			}
		},

		// 错误类信息弹框
		showError: function (sText) {
			MessageBox.error(sText, {
				styleClass: "sapUiSizeCompact"
			});
		},

		// 警告类信息弹框
		showWarning: function (sText) {
			MessageBox.warning(sText, {
				styleClass: "sapUiSizeCompact"
			});
		},

		// 成功类信息弹框
		showSuccess: function (sText) {
			MessageBox.success(sText, {
				styleClass: "sapUiSizeCompact"
			});
		},

		// 信息类信息弹框
		showInformation: function (sText) {
			MessageBox.information(sText, {
				styleClass: "sapUiSizeCompact"
			});
		},

		// Toast形式展示消息
		showText: function (sText) {
			MessageToast.show(sText, {
				width: (sText.length + 2) + "rem"
			});
		},

		// 确认信息处理
		confirmAction: function (sTitle, sText, sChannelId, sEventId, oContext) {
			MessageBox.confirm(sText, {
				title: sTitle,
				icon: MessageBox.Icon.WARNING,
				styleClass: "sapUiSizeCompact",
				actions: [
					MessageBox.Action.YES,
					MessageBox.Action.NO
				],
				onClose: function (sResult) {
					// oContext._result = sResult;
					if (sResult === MessageBox.Action.YES) {
						oContext.getOwnerComponent().getEventBus().publish(sChannelId, sEventId,oContext);
					}
				}
			});
		}
	};
});