sap.ui.define([
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
], function ( BusyDialog, MessageBox,MessageToast) {
    'use strict';

    var _myFunction, _myBusyDialog, _myMessageView, _myMessageDialog,_UserInfo;
    return {
        // formatter: formatter,

        init: function (oModels) {
            _myFunction = sap.ui.require("pp/zledplannedordercomponent/ext/controller/ListReportExt");
            _myBusyDialog = new BusyDialog();
            _UserInfo = sap.ushell.Container.getService("UserInfo");
            // *************************************************
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                subtitle: '{subtitle}',
                counter: 1
            });
            _myMessageView = new sap.m.MessageView({
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
                    _myMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            _myMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: _myMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        _myMessageDialog.close();
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
            var oLocalModel = oModels.local;
            var oI18nModel = oModels.i18n;

            // Authority Check
            var oAuthorityModel = oModels.Authority;
            this._getAuthorityData(oAuthorityModel, oLocalModel, oI18nModel);
        },

        _getAuthorityData: function (oAuthorityModel, oLocalModel, oI18nModel) {
            var sUser = _UserInfo.getFullName() === undefined ? "" : _UserInfo.getFullName();
            var sEmail = _UserInfo.getEmail() === undefined ? "" : _UserInfo.getEmail();
            var oContextBinding = oAuthorityModel.bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
                "$expand": "_AssignPlant,_AssignCompany,_AssignSalesOrg,_AssignPurchOrg,_AssignRole($expand=_UserRoleAccessBtn)"
            });
            oContextBinding.requestObject().then(function (context) {
                var aAccessBtns = [],
                    aAllAccessBtns = [];
                if (context._AssignRole && context._AssignRole.length > 0) {
                    context._AssignRole.forEach(role => {
                        aAccessBtns.push(role._UserRoleAccessBtn);
                    });
                    aAllAccessBtns = aAccessBtns.flat();
                }
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zledplannedordercomponent-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: oI18nModel.getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                oLocalModel.setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zledplannedordercomponent-View"),
                        Accept: aAllAccessBtns.some(btn => btn.AccessId === "zledplannedordercomponent-Accept"),
                    },
                    data: {
                        PlantSet: context._AssignPlant,
                        CompanySet: context._AssignCompany,
                        SalesOrgSet: context._AssignSalesOrg,
                        PurchOrgSet: context._AssignPurchOrg,
                        RoleSet: context._AssignRole
                    }
                });
            }.bind(this), function (oError) {
                if (!this.oErrorMessageDialog) {
                    this.oErrorMessageDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        state: "Error",
                        content: new sap.m.Text({
                            text: oI18nModel.getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
        },

        onAccept: function () {
            var that = this;
            _myFunction._processRequest("ACCEPT", that);
        },

        _processRequest: function (bEvent, that) {
            var sTitle, items = [];
            var aContexts = that._controller.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                if (element.getObject(element.getPath()).Status == "") {
                    items.push(element.getObject(element.getPath()));
                }
            });
            if (items.length == 0) {
                MessageBox.show(that.getModel("i18n").getResourceBundle().getText("confirmMessage1"))
                return;
            }
            var oRequestData = items
            switch (bEvent) {
                case "ACCEPT":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Accept");
                    break;
                default:
                    break;
            }
            MessageBox.confirm(that.getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        _myFunction._callOData(bEvent, oRequestData, that);
                    }
                },
                dependentOn: that.routing.getView()
            });
        },

        _callOData: function (bEvent, oRequestData, that) {
            var aPromise = [];
            aPromise.push(_myFunction._callODataAction(bEvent, oRequestData, that));
            try {
                _myBusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    _myBusyDialog.close();
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var result = JSON.parse(object.Zzkey);
                        // 获取选中的上下文
                        var aContexts = that._controller.extensionAPI.getSelectedContexts();

                        // 遍历 ITEMS 和选中的 aContexts 进行匹配
                        result.forEach((element, index) => {
                            if (aContexts[index]) { // 确保索引不越界
                                var sPath = aContexts[index].getPath(); // 获取选中条目的路径
                                // 设置对应的 Message 和 Status
                                aContexts[index].setProperty(sPath + "/Message", element.MESSAGE)
                                aContexts[index].setProperty(sPath + "/Status", element.STATUS)
                            }
                        });
                    }
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    _myBusyDialog.close();
                });
            } catch (error) {
                MessageBox.error(error);
                _myBusyDialog.close();
            }
        },

        _callODataAction: function (bEvent, aRequestData, that) {
            return new Promise((resolve, reject) => {
                var processLogic = that.getModel().bindContext("/ZR_LEDPLANNEDORDERCOMPONENT/com.sap.gateway.srvd.zui_ledplannedorder_o4.v0001.processLogic(...)");
                processLogic.setParameter("Event", bEvent);
                processLogic.setParameter("Zzkey", JSON.stringify(aRequestData));
                processLogic.setParameter("RecordUUID", "");
                processLogic.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(processLogic);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    };
});
