sap.ui.define([
    "./Base"
], function (Base) {
    "use strict";

    return Base.extend("bi.recoverymanagement.controller.MainView", {

        onInit: function () {
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
            this.getRouter().getRoute("MainView").attachMatched(this._initialize, this);
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-View"),
                        Report1: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report1"),
                        Report1_Create: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report1_Create"),
                        Report1_Edit: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report1_Edit"),
                        Report1_Save: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report1_Save"),
                        Report2: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report2"),
                        Report3: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report3"),
                        Report4: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report4"),
                        Report5: aAllAccessBtns.some(btn => btn.AccessId === "recoverymanagement-Report5")
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
        }
    });
});