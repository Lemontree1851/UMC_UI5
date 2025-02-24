sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"../model/formatter",
], function (Controller, History, UIComponent, formatter) {
	"use strict";

	return Controller.extend("mm.zprworkflow.controller.BaseController", {

		onInit: function () {
			this.localData = this.getOwnerComponent().getModel("local");
			this.oDataModel = this.getOwnerComponent().getModel();
			this.resourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("RouteMain", {}, true /*no history*/);
			}
		},
		setBusy: function (busy) {
			this.localData.setProperty("/busy", busy, false);
		},

		accNumber: function () {
			Number.prototype.add = function (arg) {
				return formatter.accAdd(this, arg);
			};
			String.prototype.add = function (arg) {
				return formatter.accAdd(this, arg);
			};
			Number.prototype.sub = function (arg) {
				return formatter.accSub(this, arg);
			};
			String.prototype.sub = function (arg) {
				return formatter.accSub(this, arg);
			};
			Number.prototype.mul = function (arg) {
				return formatter.accMul(this, arg);
			};
			String.prototype.mul = function (arg) {
				return formatter.accMul(this, arg);
			};
			Number.prototype.div = function (arg) {
				return formatter.accDiv(this, arg);
			};
			String.prototype.div = function (arg) {
				return formatter.accDiv(this, arg);
			};
		},

		overwriteToFixed: function () {
			Number.prototype.toFixed = function (digits) {
				var times = Math.pow(10, digits);
				var result
				if (this < 0) {
					result = this * times - 0.5;
				} else {
					result = this * times + 0.5;
				}
				result = parseInt(result, 10) / times;
				result = result.toString();
				// 补足小数位
				if (digits > 0) {
					var decimalPos = result.indexOf(".");
					if (decimalPos < 0) {
						decimalPos = result.length;
						result += ".";
					}
					while (result.length <= decimalPos + digits) {
						result += "0";
					}
				}
				return result;
			};
		},

		_CallODataV2: function (sMethod, sPath, aFilters, mUrlParameter, oRequestData) {
			var that = this;
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			return new Promise(function (resolve, reject) {
				var mParameters = {
					method: sMethod === "READ" ? "GET" : "POST",
					filters: aFilters,
					urlParameters: mUrlParameter,
					success: function (oResponse) {
						oBusyDialog.close();
						resolve(oResponse);
					},
					error: function (oErr) {
						oBusyDialog.close();
						// var oError = JSON.parse(oErr.responseText);
						// var sMsg;
						// if (oError.error.innererror.errordetails.length > 0) {
						//     sMsg = oError.error.innererror.errordetails[0].message;
						// } else {
						//     sMsg = oError.error.message.value;
						// }
						// MessageBox.error(sMsg);
						reject(JSON.parse(oErr.responseText));
					}
				};
				switch (sMethod) {
					case "READ":
						that.getView().getModel().read(sPath, mParameters);
						break;
					case "CREATE":
						that.getView().getModel().create(sPath, oRequestData, mParameters);
						break;
					case "UPDATE":
						that.getView().getModel().update(sPath, oRequestData, mParameters);
						break;
					case "DELETE":
						that.getView().getModel().remove(sPath, mParameters);
						break;
					case "ACTION":
						that.getView().getModel().callFunction(sPath, mParameters);
						break;
					default:
						break;
				}
			});
		}
	});
});