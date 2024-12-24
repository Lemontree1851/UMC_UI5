sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("pp.zcomponentusagelist.controller.Main", {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zcomponentusagelist-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zcomponentusagelist-View")
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
            // //设置默认值
            oSmartFilterBar.setFilterData({
                NoDisplayNonProduct: false,
                DisplayPurchasingInfo: false
            });
        },

        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            var oTable = this.byId("idTable");

            // 获取 DisplayPurchasingInfo 的值
            // var oSmartFilterBar = this.byId("idSmartFilterBar");
            // var sDisplayPurchasingInfo = oSmartFilterBar.getFilterData().DisplayPurchasingInfo;
            var sDisplayPurchasingInfo = this.byId("idCB2").getSelected();

            // 动态显示或隐藏列
            var oColumns = oTable.getColumns();
            var bShowColumn = sDisplayPurchasingInfo === true ? true : false; // 有值时显示，没值时隐藏

            oColumns.forEach(function (oColumn) {
                if (oColumn.getSortProperty() === "SupplierMaterialNumber" || oColumn.getSortProperty() === "ProductManufacturerNumber") {
                    oColumn.setVisible(bShowColumn);
                }
            });

            // 根据选择框，添加过滤条件传值到后端
            var filters = oEvent.getParameters().bindingParams.filters;
            if(!filters){
                filters =[];
            }

            var sNoDisplayNonProduct = this.byId("idCB1").getSelected();

            if (sNoDisplayNonProduct === true) { 
                var oIndicator1Filter = new sap.ui.model.Filter({
                    path: "NoDisplayNonProduct",
                    operator: "EQ",
                    value1: sNoDisplayNonProduct
                });
                filters.push(oIndicator1Filter);
            }
        }
    });
});
