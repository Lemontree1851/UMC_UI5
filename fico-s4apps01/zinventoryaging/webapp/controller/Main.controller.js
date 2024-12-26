sap.ui.define([
    "../model/formatter",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox"
], function (formatter, Controller, UIComponent, MessageBox) {
    "use strict";

    return Controller.extend("fico.zinventoryaging.controller.Main", {
        formatter: formatter,
        
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
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            var oContextBinding = this.getView().getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zinventoryaging-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                this.getOwnerComponent().getModel("local").setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryaging-View"),
                        ReCalculate: aAllAccessBtns.some(btn => btn.AccessId === "zinventoryaging-Calculate"),
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
                            text: this.getView().getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
        },

        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        // 点执行按钮后的响应
        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;

            // 获取 选择字段 的值
            var oSmartFilterBar = this.byId("idSmartFilterBar");
            var sCompanyCode = oSmartFilterBar.getFilterData().CompanyCode;
            var aAuthorityCompanySet = this.getView().getModel("local").getProperty("/authorityCheck/data/CompanySet");

            if (!aAuthorityCompanySet.some(data => data.CompanyCode === sCompanyCode)) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityCompany", [sCompanyCode]));    

                var oFiltersCompanyCode = aFilters[0].aFilters.find(Filters => Filters.sPath === "CompanyCode");
                if (oFiltersCompanyCode) {
                    oFiltersCompanyCode.oValue1 = '';
                }
            }
        },

        onPressBtn: function (sEvent) {
            var that = this;

            if (sEvent === "ReCalculate") {
                // 获取 选择字段 的值
                var oSmartFilterBar = this.byId("idSmartFilterBar");
                var sCompanyCode = oSmartFilterBar.getFilterData().CompanyCode;
                var sFiscalYear = oSmartFilterBar.getFilterData().FiscalYear;
                var sFiscalPeriod = oSmartFilterBar.getFilterData().FiscalPeriod;
                var sLedger = oSmartFilterBar.getFilterData().Ledger;
                var sFieldName = '';
                var aAuthorityCompanySet = this.getView().getModel("local").getProperty("/authorityCheck/data/CompanySet");

                if (!sCompanyCode) {
                    sFieldName = this.getView().getModel("i18n").getResourceBundle().getText("CompanyCode");
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("FilterMandatory",[sFieldName]));
                    return;
                }

                if (!sFiscalYear) {
                    sFieldName = this.getView().getModel("i18n").getResourceBundle().getText("FiscalYear");
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("FilterMandatory",[sFieldName]));
                    return;
                }

                if (!sFiscalPeriod) {
                    sFieldName = this.getView().getModel("i18n").getResourceBundle().getText("FiscalPeriod");
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("FilterMandatory",[sFieldName]));
                    return;
                }

                if (!sLedger) {
                    sFieldName = this.getView().getModel("i18n").getResourceBundle().getText("Ledger");
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("FilterMandatory",[sFieldName]));
                    return;
                }

                if (!aAuthorityCompanySet.some(data => data.CompanyCode === sCompanyCode)) {
                    MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityCompany", [sCompanyCode]));     
                    return;
                }

                var sTitle;

                switch (sEvent) {
                    case "ReCalculate":
                        sTitle = this.getView().getModel("i18n").getResourceBundle().getText("ReCalculate");
                        break;
                    default:
                        break;
                }
 
                var oFilterData = {
                    "companycode": sCompanyCode,
                    "fiscalyear": sFiscalYear,
                    "fiscalperiod": sFiscalPeriod,
                    "ledger": sLedger
                };

                var oRequestData = {
                    filterdata: oFilterData,
                    // user: this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail(),
                    // username: this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName(),
                    // datetime: this.getCurrentUTCDateTime()
                    // user: "P00001",
                    // username: "Xinlei Xu",
                    // datetime: this._getCurrentDateTime()
                }

                MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("ConfirmMessage"), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._callOData(sEvent, oRequestData);
                        }
                    },
                    dependentOn: this.getView()
                });
            }
        },

        _callOData: function (sEvent, oRequestData) {
            var that = this;
            var aPromise = [];
            aPromise.push(this._CallODataV2("ACTION", "/processLogic", [], {
                "Event": sEvent,
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}));

            try {
                Promise.all(aPromise).then((aContext) => {

        

                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    MessageBox.success(this.getView().getModel("i18n").getResourceBundle().getText("DoneMessage"));
    
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
        },

        onsMrilterBarInitialized: function (oEvent) {
            var oSmartFilterBar = oEvent.getSource();
            // 设置默认值
            oSmartFilterBar.setFilterData({
      
            });
        },

        // 勾选Checkbox的响应
        onSelect: function (oEvent) {
           
        },

        // 点执行按钮后的响应
        onSearch: function (oEvent) {
           
        },

        // 点导出按钮后的响应
        onBeforeExport: function (oEvent) {
            var oSettings = oEvent.getParameter("exportSettings");
            var columns = oSettings.workbook.columns;

            try {
                // columns.find(cloumn => cloumn.property === "DeliveryDate").type = "Date";
            } catch (error) {
                
            }
        },
    });
});

