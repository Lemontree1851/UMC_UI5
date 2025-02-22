sap.ui.define([
    "./BaseController",
],
    function (BaseController) {
        "use strict";

        return BaseController.extend("mm.uploadpurchasereq.controller.Main", {
            onInit: function () {
                this._UserInfo = sap.ushell.Container.getService("UserInfo");
                // this.getRouter().getRoute("RouteMain").attachMatched(this._initialize, this);

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
                    if (!aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-View")) {
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
                            View: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-View"),
                            Upload: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-Upload"),
                            Export: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-Export"),
                            Check: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-Check"),
                            Excute: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-Excute"),
                            POLink: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-POLink"),
                            PRApproveReturn: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-PRApproveReturn"),
                            PRApproveSend: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-PRApproveSend"),
                            Edit: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-Edit"),
                            AttachmentDelete: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-AttachmentDelete"),
                            AttachmentUpload: aAllAccessBtns.some(btn => btn.AccessId === "uploadpurchasereq-AttachmentUpload"),
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
        });
    });
