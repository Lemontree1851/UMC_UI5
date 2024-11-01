sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "../formatter/recoveryFormatter"
],
    function (Controller, MessageToast, MessageBox, recoveryFormatter) {
        "use strict";

        return Controller.extend("recoverymanagement.controller.MasterMaintain", {
            formatter: recoveryFormatter,
            _getI18nBundle: function () {
                return this.getView().getModel("i18n").getResourceBundle();
            },

            onInit: function () {
            },

            onCreateNewRecovery: function (oEvent) {
                const oBindingContext = this.getView().byId("idCreateDialog").getBindingContext();

                if (!oBindingContext) {
                    return;
                }

                var sCompany = oBindingContext.getProperty("CompanyCode");
                var sYear = oBindingContext.getProperty("RecoveryYear");
                var sType = oBindingContext.getProperty("RecoveryType");
                var sCustomer = oBindingContext.getProperty("Customer");

                //var oI18nBundle = this.getView().getModel("i18n").getResourceBundle();

                if (!sCompany || sCompany === '') {
                    MessageBox.error(this._getI18nBundle().getText("companyCodeEmpty"));
                    return;
                }

                if (!sYear || sYear === '') {
                    MessageBox.error(this._getI18nBundle().getText("yearEmpty"));
                    return;
                }

                if (!sType || sType === '') {
                    MessageBox.error(this._getI18nBundle().getText("typeEmpty"));
                    return;
                }

                if (!sCustomer || sCustomer === '') {
                    MessageBox.error(this._getI18nBundle().getText("customerEmpty"));
                    return;
                }

                var oModel = this.getView().getModel();

                if (!oModel) {
                    return;
                }

                var that = this;
                oModel.submitChanges({
                    success: function (oRes) {
                        MessageToast.show(that._getI18nBundle().getText("dataSavedOK"));
                        that._closeDialog(that, 'idCreateDialog');
                        oModel.refresh();
                    },
                    error: function (oErr) {
                        const sMsgRoot = MessageToast.show(that._getI18nBundle().getText("dataSavedFailed"));
                        MessageBox.error(`${sMsgRoot}: ${oErr.getText()}`);
                    }
                });

            },

            onSave: function (oEvent) {

                var oModel = this.getView().getModel();

                if (!oModel) {
                    return;
                }

                if (!oModel.hasPendingChanges()) {
                    MessageToast.show(this._getI18nBundle().getText("noDataChanged"));
                    return;
                }

                var that = this;
                oModel.submitChanges({
                    success: function (oRes) {
                        MessageToast.show(that._getI18nBundle().getText("dataSavedOK"));
                    },
                    error: function (oErr) {
                        MessageToast.show(that._getI18nBundle().getText("dataSavedFailed"));
                    }
                });

            },


            onCloseCreateDialog: function (oEvent) {
                var oModel = this.getView().getModel();
                var oContext = this.getView().byId("createForm").getBindingContext();
                oModel.deleteCreatedEntry(oContext);
                this._closeDialog(this, 'idCreateDialog');
            },

            onCreate: function (oEvent) {
                //this.openDialog(this, 'recoverymanagement.view.Create');
                var oModel = this.getView().getModel();
                var sYear = new Date(Date.now()).getFullYear();
                var oBindingContext = oModel.createEntry("/ZC_BI003_REPORT_001", {
                    properties: {
                        RecoveryYear: String(sYear)
                    }
                });

                this.loadFragment({
                    name: 'recoverymanagement.view.Create'
                }).then(function (oDialog) {
                    oDialog.setBindingContext(oBindingContext);
                    oDialog.open();
                });
            },

            _closeDialog: function (oContext, sDialogId) {
                var oDialog = oContext.getView().byId(sDialogId);
                oDialog.close();
                oDialog.destroy();
            },
        });
    });