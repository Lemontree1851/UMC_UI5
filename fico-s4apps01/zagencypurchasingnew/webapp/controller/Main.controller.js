sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet"
], function (Base, formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment, Spreadsheet) {
    "use strict";

    return Base.extend("fico.zagencypurchasingnew.controller.Main", {

        formatter: formatter,

        onInit: function () {
            var that = this;
            this._myBusyDialog = new BusyDialog();
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
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
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
            this._oTable = this.byId("idStandardListTable");
        },

        _initialize: function () {
            var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            var oContextBinding = this.getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zagencypurchasingnew-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: this.getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                this.getModel("local").setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zagencypurchasingnew-View"),
                        Post: aAllAccessBtns.some(btn => btn.AccessId === "zagencypurchasingnew-Post")
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
                            text: this.getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
        },

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            aFilters.push(new Filter("UserEmail", FilterOperator.EQ, sEmail));
        },

        onSearch: function () {
            this.getModel().resetChanges();
        },

        onJournalentry: function () {
            this._processRequest("POSTING");
        },

        _processRequest: function (bEvent) {
            var that = this;
            var sTitle, items = [];

            var aSelectedItems = this._oTable.getSelectedIndices();
            var iLen = aSelectedItems.length;
            if (!iLen) {
                MessageBox.error(this.getResourceBundle().getText("NoneSelected"));
                return;
            }
            while (iLen--) {
                var sPath = this._oTable.getContextByIndex(aSelectedItems[iLen]).getPath();
                var oRow = this.getModel().getObject(sPath);
                items.push(oRow);
            }
            var oRequestData = {
                items: items,
                user: this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail(),
                username: this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName(),
                datetime: this.getCurrentUTCDateTime()
            }
            switch (bEvent) {
                case "POSTING":
                    sTitle = this.getModel("i18n").getResourceBundle().getText("Posting");
                    break;
                default:
                    break;
            }
            MessageBox.confirm(this.getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
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
                    MessageToast.show(this.getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                    for (const activeContext of aContext) {
                        var object = activeContext.processLogic;
                        var result = JSON.parse(object.Zzkey);
                        result.ITEMS.forEach((element) => {
                            var sPath = "/Itemdata(PostingDate='" + element.POSTINGDATE + "',CompanyCode='" + element.COMPANYCODE + "',CompanyCodeCurrency='" + element.COMPANYCODECURRENCY + "',TaxCode='" + element.TAXCODE + "')";
                            that.getModel().setProperty(sPath + "/message", element.MESSAGE);
                            that.getModel().setProperty(sPath + "/accountingdocument1", element.ACCOUNTINGDOCUMENT1);
                            that.getModel().setProperty(sPath + "/accountingdocument2", element.ACCOUNTINGDOCUMENT2);
                        });
                    }
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    // refresh
                    that.getModel().refresh();
                });
            } catch (error) {
                MessageBox.error(error);
            }
        }
    });
});
