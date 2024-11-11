sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"../model/formatter",
	"./messages",
], function (Controller, History, UIComponent, formatter,messages) {
	"use strict";

	return Controller.extend("sd.zdndatebatchupdate.controller.BaseController", {

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
				this.getRouter().navTo("RouteMain", {}, true /*no history*/ );
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

        postAction: function (sAction, postData,i) {
			this.localData = this.getOwnerComponent().getModel("local");
            this.oDataModel = this.getOwnerComponent().getModel();

            var oModel = this.oDataModel;
                // aDeferredGroups = oModel.getDeferredGroups();
            // aDeferredGroups = aDeferredGroups.concat(["myId"]);
            // oModel.setDeferredGroups(aDeferredGroups);

            oModel.callFunction("/batchProcess", {
                method: "POST",
                // groupId: "myId",//如果设置groupid，会多条一起进入action
                changeSetId: i,
                //建议只传输前端修改的参数，其他字段从后端获取
                urlParameters: {
                    Event: sAction,
                    Zzkey: postData
                },
                success: function (oData) {
                    let aExcelSet = this.localData.getProperty("/excelSet");
                    let result = JSON.parse(oData["batchProcess"].Zzkey);
                    if (sAction === "export") {
                        if (oData["batchProcess"].RecordUUID) {
                            var sURL = this.getOwnerComponent().getModel("Print").getServiceUrl() + "PrintRecord(RecordUUID=" + oData["batchProcess"].RecordUUID + ",IsActiveEntity=true)/PDFContent";
                            sap.m.URLHelper.redirect(sURL, true);
                        }
                    }else{
                        result.forEach(function (line) {
                            for ( let i = 0; i < aExcelSet.length; i++ ) {
                                if (aExcelSet[i].Row == line.ROW ) {
                                    Object.keys(aExcelSet[0]).forEach(function(key) {
                                        if (key == "Status" || key == "Message") {
                                            aExcelSet[i][key] = line[key.toUpperCase()];
                                        }
                                    });
                                    // aExcelSet[i].Type = line.TYPE;
                                    // aExcelSet[i].Message = line.MESSAGE;
                                }
                            }
                        });
                    };
                    this.localData.setProperty("/excelSet", aExcelSet);
                    this.getErrorCount(aExcelSet, sAction);
                }.bind(this),
                error: function (oError) {
                    this.localData.setProperty("/recordCheckSuccessed", false);
                    messages.showError(messages.parseErrors(oError));
                }.bind(this)
            });
            // oModel.submitChanges({ groupId: "myId" });
            // var that = this;
            // var promise = new Promise(function (resolve, reject) {
            //     var oAction = that._oDataModel.bindContext("/DNProcess/com.sap.gateway.srvd.zui_salesaccept_dnprocess_o4.v0001." + sAction + "(...)");
            //     oAction.setParameter("Zzkey", JSON.stringify(postData));
            //     oAction.setParameter("Event", "");
            //     oAction.setParameter("RecordUUID", "");

            //     oAction.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
            //         try {
            //             var records = oAction.getBoundContext().getObject().value; //获取返回的数据
            //         } catch (e) { }
            //         resolve(records);

            //     }).catch((oError) => {
            //         messages.showError(oError.message);
            //         reject(oError);
            //     });
            // });
            // return promise;
        },

        getErrorCount: function (aExcelSet,sAction) {
            var iTotal = 0,
                iError = 0,
                iSuccess = 0;
            iTotal = aExcelSet.length;
            aExcelSet.forEach(function (value) {
                if (value.Status === "E") {
                    iError++;
                } else {
                    iSuccess++;
                }
            });
            var sLogInfo = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("logInfo", [iTotal, iSuccess, iError]);
            this.localData.setProperty("/logInfo", sLogInfo);
            if (iError > 0) {
                return;
            }
            switch (sAction) {
                case "check":
                    this.localData.setProperty("/recordCheckSuccessed", true);
                    break;
                case "save":
                    this.localData.setProperty("/recordCheckSuccessed", false);
                    break;
            }
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
		}

	});

});