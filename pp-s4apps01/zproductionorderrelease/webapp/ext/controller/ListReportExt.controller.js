sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
    'use strict';

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
                that.getView().getModel().setProperty(sPath + "/Message", '1111');
                that.getView().getModel().setProperty(sPath + "/Criticality", '1');
                var OriErrorIndicator = that.getView().getModel().getProperty(sPath + "/Message");
                items.push({
                    Plant: aSplitArray[1],
                    ManufacturingOrder: aSplitArray[3]
                    // OriErrorIndicator: OriErrorIndicator
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
                        // that.getView().getModel("local").setProperty("/headSet/MaterialRequisitionNo", result.HEADER.MATERIAL_REQUISITION_NO);
                        // var boundContext = activeContext.getBoundContext();
                        // var object = boundContext.getObject();
                        // var result = JSON.parse(object.Zzkey);
                        var object = activeContext.processLogic;
                        var result = JSON.parse(object.Zzkey);
                        // result.MESSAGEITEMS.forEach(element => {

                        //     aMessageItems.push({
                        //         type: element.TYPE,
                        //         title: element.TITLE,
                        //         description: element.DESCRIPTION,
                        //         subtitle: element.SUBTITLE
                        //     });
                        // });

                        result.ITEMS.forEach(element => {
                            var sPath = element.getPath();
                            
                            aMessageItems.push({
                                type: element.TYPE,
                                title: element.TITLE,
                                description: element.DESCRIPTION,
                                subtitle: element.SUBTITLE
                            });
                        });
                    }

                    // for (const activeContext of aContext) {
                    //     var object = activeContext.processLogic;
                    //     JSON.parse(object.Zzkey).forEach(element => {
                    //         for (var index = 0; index < aExcelSet.length; index++) {
                    //             if (aExcelSet[index].Row === element.ROW) {
                    //                 aExcelSet[index].Status = element.STATUS;
                    //                 aExcelSet[index].Message = element.MESSAGE;
                    //             }
                    //         }
                    //         if (element.STATUS === 'E') {
                    //             oResult.iFailed += 1;
                    //         } else {
                    //             oResult.iSuccess += 1;
                    //         }
                    //     });
                    // }


                    that.getView().getModel("local").setProperty("/MessageItems", aMessageItems);
                    that._myMessageView.setModel(that.getView().getModel("local"));

                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    var aMessageItems = that.getView().getModel("local").getProperty("/MessageItems");
                    if (aMessageItems.length > 0) {
                        that._myMessageView.navigateBack();
                        that.getView().addDependent(that._myMessageDialog);
                        that._myMessageDialog.open();
                    }
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
