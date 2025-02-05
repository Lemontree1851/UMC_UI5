sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("sd.zsalesdocumentlist.controller.Main", {
        onInit: function () {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zsalesdocumentlist-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zsalesdocumentlist-View")
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

        // 点执行按钮后的响应
        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            var oBinding = oEvent.getParameter("bindingParams");

            oBinding.events = {
                "dataReceived": function (oEvent) {
                    var oReceivedData = oEvent.getParameter('data');
                    var iSoCount = 0, iSoItemCount = 0;

                    if (oReceivedData && 
                        Array.isArray(oReceivedData.results) && 
                        oReceivedData.results.length > 0) {
                        iSoCount = oReceivedData.results[0].TotalCountSo;
                        iSoItemCount = oReceivedData.results[0].TotalCountSoItem;
                    }

                    var headerText = this.getModel("i18n").getResourceBundle().getText("Results",[iSoCount,iSoItemCount]);
                    // 更新 SmartTable 的 header 文本
                    this.setHeader(headerText);
                },
                    //More event handling can be done here
              };

            // 根据选择框，添加过滤条件传值到后端
            var filters = oEvent.getParameters().bindingParams.filters;
            if(!filters){
                filters =[];
            }

            //Authority check 
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            var oUserEmailFilter = new sap.ui.model.Filter({
                path: "UserEmail",
                operator: "EQ",
                value1: sEmail
            });
            filters.push(oUserEmailFilter);

            var sIndicator1 = this.byId("idCB1").getSelected();
            var sIndicator2 = this.byId("idCB2").getSelected();
            var sIndicator3 = this.byId("idCB3").getSelected();
            var sIndicator4 = this.byId("idCB4").getSelected();
            var sIndicator5 = this.byId("idCB5").getSelected();
            var sIndicator6 = this.byId("idCB6").getSelected();

            if (sIndicator1 === true) { 
                var oIndicator1Filter = new sap.ui.model.Filter({
                    path: "Indicator1",
                    operator: "EQ",
                    value1: sIndicator1
                });
                filters.push(oIndicator1Filter);
            }

            if (sIndicator2 === true) { 
                var oIndicator2Filter = new sap.ui.model.Filter({
                    path: "Indicator2",
                    operator: "EQ",
                    value1: sIndicator2
                });
                filters.push(oIndicator2Filter);
            }

            if (sIndicator3 === true) { 
                var oIndicator3Filter = new sap.ui.model.Filter({
                    path: "Indicator3",
                    operator: "EQ",
                    value1: sIndicator3
                });
                filters.push(oIndicator3Filter);
            }

            if (sIndicator4 === true) { 
                var oIndicator4Filter = new sap.ui.model.Filter({
                    path: "Indicator4",
                    operator: "EQ",
                    value1: sIndicator4
                });
                filters.push(oIndicator4Filter);
            }

            if (sIndicator5 === true) { 
                var oIndicator5Filter = new sap.ui.model.Filter({
                    path: "Indicator5",
                    operator: "EQ",
                    value1: sIndicator5
                });
                filters.push(oIndicator5Filter);
            }

            if (sIndicator6 === true) { 
                var oIndicator6Filter = new sap.ui.model.Filter({
                    path: "Indicator6",
                    operator: "EQ",
                    value1: sIndicator6
                });
                filters.push(oIndicator6Filter);
            }
        },

        // 点导出按钮后的响应
        onBeforeExport: function (oEvent) {
            var oSettings = oEvent.getParameter("exportSettings");
            var columns = oSettings.workbook.columns;
            // var dataSource = oSettings.dataSource;

            // oSettings.fileName = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("fileName");

            columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    case "DeliveryDate":
                    case "ConfirmedDeliveryDate":
                    case "ExchangeRateDate":
                    case "CreationDate":
                    case "CreationDateItem":
                    case "LastChangeDate":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break
                    case "OrderQuantity":
                    case "DeliveredQtyInOrderQtyUnit":
                    case "OpenConfdDelivQtyInOrdQtyUnit":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        // oColumn.delimiter =true;
                        // oColumn.textAlign ="End";
                        oColumn.unitProperty="OrderQuantityUnit";
                        break;
                    case "ComplDeliveredQtyInBaseUnit":
                    case "NoComplDeliveredQtyInBaseUnit":
                    case "EnternalTansferQtyInBaseUnit":
                    case "NoEnternalTansferQtyInBaseUnit":
                    case "BillingQuantityInBaseUnit":
                    case "NoBillingQuantityInBaseUnit":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.unitProperty="BaseUnit";
                        break;
                    case "ConditionAmountPPR0":
                    case "ConditionAmountTTX1":
                    case "ConditionAmountZPFC":
                    case "ConditionAmountZPST":
                    case "ConditionAmountZPIN":
                    case "ConditionAmountZPSB":
                    case "ConditionAmountZPSS":
                    case "ConditionAmountZPCM":
                    case "ConditionAmountZPGP": 
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.unitProperty="TransactionCurrency";
                        break;
                    default:
                        break;
                }
            });
        },
    });
});

