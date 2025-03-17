sap.ui.define([
    "./Base",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "../model/formatter"
], function (Base, Filter, FilterOperator, BusyDialog, MessageBox, formatter) {
    "use strict";

    return Base.extend("mm.purinfomasterlist.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();

            this._UserInfo = sap.ushell.Container.getService("UserInfo");
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "purinfomasterlist-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "purinfomasterlist-View")
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

        onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
            var mBindingParams = oEvent.getParameter("bindingParams");

            var sZTYPE1 = this.byId("ZTYPE1").getSelected();
            var newFilter;
            if (sZTYPE1 === true) {
                newFilter = new sap.ui.model.Filter("Ztype1", sap.ui.model.FilterOperator.EQ, "X");
            } else {
                newFilter = new sap.ui.model.Filter("Ztype1", sap.ui.model.FilterOperator.EQ, "");
            }
            mBindingParams.filters.push(newFilter);
            var sZTYPE2 = this.byId("ZTYPE2").getSelected();

            if (sZTYPE2 === true) {
                newFilter = new sap.ui.model.Filter("Ztype2", sap.ui.model.FilterOperator.EQ, "X");
            } else {
                newFilter = new sap.ui.model.Filter("Ztype2", sap.ui.model.FilterOperator.EQ, "");
            }
            mBindingParams.filters.push(newFilter);

            // ADD BEGIN BY XINLEI XU 2025/03/17
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            mBindingParams.filters.push(new Filter("UserEmail", FilterOperator.EQ, sEmail));
            // ADD END BY XINLEI XU 2025/03/17
        },

        onBeforeExport: function (oEvent) {
            var mExcelSettings = oEvent.getParameter("exportSettings");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("Result");
            mExcelSettings.workbook.columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    //  Date
                    case "condition_validity_start_date":
                    case "condition_validity_end_date":
                    case "CreationDate_1":
                    case "CreationDate_2":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break;
                    //  Currency 分隔符 小数位
                    // case "NetPriceAmount":
                    // case "ConditionRateValue":
                    // case "UnitPrice_plnt":
                    //     oColumn.type = sap.ui.export.EdmType.Currency;
                    //     oColumn.delimiter = true;
                    //     oColumn.textAlign = "End";
                    //     break;
                    case "standardpurchaseorderquantity":
                    case "Taxprice":
                    case "UnitPrice_standard":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.scale = 3
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        break;
                    //  Number 分隔符 没有小数位
                    case "MaterialPriceUnitQty":
                    case "PriceUnitQty":
                    case "NetPriceAmount":
                    case "ConditionRateValue":
                    case "ConditionScaleQuantity":
                    // case "standardpurchaseorderquantity":
                    // case "Taxprice":
                    case "UnitPrice_plnt":
                    // case "UnitPrice_standard":
                    case "MaterialPlannedDeliveryDurn":
                    case "MinimumPurchaseOrderQuantity":
                    case "MaximumOrderQuantity":
                    case "UMCJPPurchasingPrice":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.textAlign = "End";
                        // oColumn.unitProperty = "BaseUnit";
                        break;
                }
            });
            mExcelSettings.fileName = sFileName + "_" + this.getCurrentDateTime();
        }
    });
});