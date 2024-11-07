sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../formatter/recoveryFormatter"
],
    function (Controller, MessageToast, MessageBox, Filter, FilterOperator, recoveryFormatter) {
        "use strict";

        return Controller.extend("recoverymanagement.controller.MasterMaintain", {
            formatter: recoveryFormatter,
            _getI18nBundle: function () {
                return this.getView().getModel("i18n").getResourceBundle();
            },

            onInit: function () {
                this._setInitialValue();
            },

            _setInitialValue:function(){ 
                var oYear = this.byId("sfbRep01DPRecoveryYear");
                var dNow = new Date(Date.now());
                var nMonth = dNow.getMonth() + 1;
                var nYear = dNow.getFullYear();
    
                if(nMonth <= 3){ 
                    nYear = nYear - 1;
                }
     
                var sYear = String(nYear); 
                oYear.setValue(sYear);
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
                        that._rebind = true;
                        oModel.refresh();
                    },
                    error: function (oErr) {
                        const sMsgRoot = MessageToast.show(that._getI18nBundle().getText("dataSavedFailed"));
                        MessageBox.error(`${sMsgRoot}: ${oErr.getText()}`);
                    }
                });

            },

            onSaveEditRecovery: function (oEvent) { 

                var oModel = this.getView().getModel();

                if (!oModel || !oModel.hasPendingChanges()) {
                    return;
                }

                var that = this;
                oModel.submitChanges({
                    success: function (oRes) {
                        MessageToast.show(that._getI18nBundle().getText("dataSavedOK"));
                        that._closeDialog(that, 'idEditDialog');
                        that._rebind = true;
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

            onCloseEditDialog: function (oEvent) {
                var oModel = this.getView().getModel();
               // var oContext = this.getView().byId("editForm").getBindingContext();
                
                if(oModel.hasPendingChanges()){
                    oModel.resetChanges();
                }

                this._closeDialog(this, 'idEditDialog');
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

            onEdit: function (oEvent) {
                var oTable = this.byId("tableMaster");

                if(!oTable){
                    return;
                }

                const aIndex = oTable.getSelectedIndices();

                if(aIndex.length !== 1){
                    MessageToast.show(this._getI18nBundle().getText("selectOneRecord"));
                    return;
                } 


                var oBindingContext = oTable.getContextByIndex(aIndex[0]);

                this.loadFragment({
                    name: 'recoverymanagement.view.Edit'
                }).then(function (oDialog) {
                    oDialog.setBindingContext(oBindingContext);
                    oDialog.open();
                });
            },

            onBeforeRebindTable: function (oEvent) {
                var oParameters = oEvent.getParameter("bindingParams");
                var oYear = this.byId("sfbRep01DPRecoveryYear");

                //Filter
                if (oYear) {
                    var sYear = oYear.getValue();
                    if (sYear !== '') {
                        oParameters.filters.push(
                            new Filter(
                                "RecoveryYear",
                                FilterOperator.EQ,
                                oYear.getValue()
                            )
                        );
                    }
                }

                //Sort

                if (this._rebind === undefined) {
                    this._rebind = true;
                }

                if (!this._rebind) {
                    return;
                }


                oParameters.sorter = [new sap.ui.model.Sorter("RecoveryType", false),
                new sap.ui.model.Sorter("RecoveryManagementNumber", false)
                ];

                this._rebind = false;
            },

            _closeDialog: function (oContext, sDialogId) {
                var oDialog = oContext.getView().byId(sDialogId);
                oDialog.close();
                oDialog.destroy();
            },

            onDestroy : function(oEvent){
                var oSource = oEvent.getSource();
                if(oSource){
                    oSource.destroy();
                }
            }
        });
    });