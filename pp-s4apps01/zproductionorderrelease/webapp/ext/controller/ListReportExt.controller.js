sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
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
            document.querySelector('[id*="btnGo"]').addEventListener('click', function (event) {
                globalThis.getView().getModel().resetChanges();
            });
        },

        onRelease: function () {
            this.getView().getModel("local").setProperty("/MessageItems", []);
            this._processRequest("RELEASE");
        },

        _processRequest: function (bEvent) {
            var that = this;
            var sTitle, items = [];
            var aContexts = this.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                let aSplitArray = element.getPath().split("'");
                var sPath = element.getPath();
                var MfgOrderPlannedTotalQty = that.getView().getModel().getProperty(sPath + "/MfgOrderPlannedTotalQty");
                var ProductType = that.getView().getModel().getProperty(sPath + "/ProductType");
                var Material = that.getView().getModel().getProperty(sPath + "/Material");
                items.push({
                    Plant: aSplitArray[1],
                    ManufacturingOrder: aSplitArray[3],
                    MfgOrderPlannedTotalQty: MfgOrderPlannedTotalQty,
                    ProductType: ProductType,
                    Material: Material
                });
            });
            var oRequestData = {
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: this._getCurrentDateTime()
            }
            switch (bEvent) {
                case "RELEASE":
                    sTitle = this.getView().getModel("i18n").getResourceBundle().getText("Release");
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

                    var aMessageItems = [];
                    for (const activeContext of aContext) {
                        // var boundContext = activeContext.getBoundContext();
                        // var object = boundContext.getObject();
                        // var result = JSON.parse(object.Zzkey);
                        var object = activeContext.processLogic;
                        var result = JSON.parse(object.Zzkey);

                        // 获取选中的上下文
                        var aContexts = this.extensionAPI.getSelectedContexts();

                        // 遍历 ITEMS 和选中的 aContexts 进行匹配
                        result.ITEMS.forEach((element, index) => {
                            if (aContexts[index]) { // 确保索引不越界
                                var sPath = aContexts[index].getPath(); // 获取选中条目的路径
                                // 设置对应的 Message 和 Criticality
                                that.getView().getModel().setProperty(sPath + "/Message", element.MESSAGE);
                                that.getView().getModel().setProperty(sPath + "/Criticality", element.CRITICALITY);
                            }
                        });

                        // 将其添加到 MessageItems 列表中，供 MessageView 使用
                        result.MESSAGEITEMS.forEach(element => {
                            aMessageItems.push({
                                type: element.TYPE,
                                title: element.TITLE,
                                description: element.DESCRIPTION,
                                subtitle: element.SUBTITLE
                            });
                        });
                    }

                    that.getView().getModel("local").setProperty("/MessageItems", aMessageItems);
                    that._myMessageView.setModel(that.getView().getModel("local"));

                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    // var aMessageItems = that.getView().getModel("local").getProperty("/MessageItems");
                    // if (aMessageItems.length > 0) {
                    //     that._myMessageView.navigateBack();
                    //     that.getView().addDependent(that._myMessageDialog);
                    //     that._myMessageDialog.open();
                    // }

                    // refresh
                    // that.getView().getModel().refresh();
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
