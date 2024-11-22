sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (MessageBox, MessageToast) {
    'use strict';

    var globalThis;
    return {

        onInit: function () {
            var that = this;
            // *************************************************
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                subtitle: '{subtitle}',
                counter: 1
            });
            this._myMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "/MessageItems",
                    template: oMessageTemplate
                }
            });
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    that._myMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            this._myMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: this._myMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        that._myMessageDialog.close();
                    },
                    text: "{i18n>CloseBtn}"
                }),
                customHeader: new sap.m.Bar({
                    contentLeft: [oBackButton],
                    contentMiddle: [
                        new sap.m.Title({
                            text: "{i18n>Results}",
                            level: "H1"
                        })
                    ]
                }),
                contentHeight: "50%",
                contentWidth: "30%",
                verticalScrolling: false
            });
            // *************************************************
        },

        onAfterRendering: function () {
            globalThis = this;
            var timerId = setInterval(function () {
                var button = document.querySelector('[id*="btnGo"]');
                if (button) {
                    button.addEventListener('click', function () {
                        globalThis.getView().getModel().resetChanges();
                    });
                    clearInterval(timerId);
                }
            }, 1000);
        },

        onJournalentry: function () {
            this._processRequest("POSTING");
        },

        _processRequest: function (bEvent) {
            var that = this;
            var sTitle, items = [];
            var aContexts = this.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                items.push(element.getObject(element.getPath()));
            });
            var oRequestData = {
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: this._getCurrentDateTime()
            }
            switch (bEvent) {
                case "POSTING":
                    sTitle = this.getView().getModel("i18n").getResourceBundle().getText("Posting");
                    break;
                default:
                    break;
            }
            MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._callOData(bEvent, oRequestData);
                    }
                },
                dependentOn: this.getView()
            });
        },

        _callOData: function (bEvent, oRequestData) {
            var that = this;
            var aPromise = [];
            aPromise.push(this._CallODataV2("ACTION", "/processLogic", [], {
                "Event": bEvent,
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}));
            try {
                Promise.all(aPromise).then((aContext) => {
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                    for (const activeContext of aContext) {
                        var object = activeContext.processLogic;
                        var result = JSON.parse(object.Zzkey);
                        // 获取选中的上下文
                        var aContexts = this.extensionAPI.getSelectedContexts();
                        // 遍历 ITEMS 和选中的 aContexts 进行匹配
                        result.ITEMS.forEach((element, index) => {
                            if (aContexts[index]) { // 确保索引不越界
                                var sPath = aContexts[index].getPath(); // 获取选中条目的路径
                                that.getView().getModel().setProperty(sPath + "/message", element.MESSAGE);
                                that.getView().getModel().setProperty(sPath + "/accountingdocument1", element.ACCOUNTINGDOCUMENT1);
                                that.getView().getModel().setProperty(sPath + "/accountingdocument2", element.ACCOUNTINGDOCUMENT2);
                            }
                        });
                    }
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    // refresh
                    that.getView().getModel().refresh();
                });
            } catch (error) {
                MessageBox.error(error);
            }
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
        },

        _removeDuplicates: function (arr, keys) {
            return arr.reduce((result, obj) => {
                const index = result.findIndex(item => {
                    return keys.every(key => item[key] === obj[key]);
                });
                if (index !== -1) {
                    result[index] = obj;
                } else {
                    result.push(obj);
                }
                return result;
            }, []);
        },

        _getCurrentDateTime: function () {
            var date = new Date();
            var sTime = date.getUTCFullYear().toString() +
                this._pad2(date.getUTCMonth() + 1) +
                this._pad2(date.getUTCDate()) +
                this._pad2(date.getUTCHours()) +
                this._pad2(date.getUTCMinutes()) +
                this._pad2(date.getUTCSeconds());
            return sTime;
        },
        _pad2: function (n) {
            return parseInt(n) < 10 ? "0" + parseInt(n) : n;
        }
    };
});
