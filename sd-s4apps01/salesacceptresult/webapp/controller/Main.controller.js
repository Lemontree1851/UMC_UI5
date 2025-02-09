sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
], function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox) {
    "use strict";

    return Base.extend("sd.salesacceptresult.controller.Main", {
        formatter: formatter,
        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._BusyDialog = new BusyDialog();
            this._oDataModel.setRefreshAfterChange(false);
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);

            this._oDataModel.attachBatchRequestCompleted(function (oEvent) {
                this.setBusy(false);

                //Take any one of the returned data. 
                //However, because the key value is used to retrieve the data in OData, you need to obtain all the key values first
                var aDataKey = Object.getOwnPropertyNames(this._oDataModel.getProperty("/"));
                for (var i = aDataKey.length - 1; i >= 0; i--) {
                    if (aDataKey[i].substring(0, 21) !== "SalesAcceptanceResult") {
                        aDataKey.splice(i, 1);
                    }
                }
                //Get a piece of data and store it in localmodel (the required field values are the same for all records, so take any one)
                this._LocalData.setProperty("/head", this._oDataModel.getProperty("/" + aDataKey[0]));

            }.bind(this));

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Main").attachMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            // Logic to refresh the first page
            this._refreshPageContent();
        },

        _refreshPageContent: function () {
            // Example: Refresh a model or call a service
            this._oDataModel.setRefreshAfterChange(false);
            this._oDataModel.refresh();
        },

        _initialize: function () {
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "salesacceptresult-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptresult-View"),
                        Save: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptresult-Save"),
                        Navigate: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptresult-Navigate")
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
            var filters = oEvent.getParameters().bindingParams.filters;
            if (!filters) {
                filters = [];
            }
            var aLTEXT1 = this.byId("idPeriodType").getSelectedKey();

            var oPeriodType = new sap.ui.model.Filter({
                path: "PeriodType",
                operator: "EQ",
                value1: aLTEXT1
            });
            filters.push(oPeriodType);
            
            var aYear = new Date(this.byId("idAcceptYear").getValue());
            var oAcceptYear = new sap.ui.model.Filter({
                path: "AcceptYear",
                operator: "EQ", 
                value1: aYear
            });
            filters.push(oAcceptYear);

            var aLTEXT2 = this.byId("idAcceptPeriod").getSelectedKey();
            var oAcceptPeriod = new sap.ui.model.Filter({
                path: "AcceptPeriod",
                operator: "EQ",
                value1: aLTEXT2
            });
            filters.push(oAcceptPeriod);

            var aLTEXT3 = this.byId("idFinishStatus").getSelectedKey();
            var oAcceptPeriod = new sap.ui.model.Filter({
                path: "FinishStatus",
                operator: "EQ",
                value1: aLTEXT3
            });
            filters.push(oAcceptPeriod);

            var oLayer = new sap.ui.model.Filter({
                path: "Layer",
                operator: "EQ",
                value1: "1"
            });
            filters.push(oLayer);
            var oModel = this.getOwnerComponent().getModel();
            if (oModel.hasPendingChanges()) {
                // 重置未保存的更改
                oModel.resetChanges();
            }
        },

        onChange: function (oEvent, sProperty) {
            var sPath = oEvent.getSource().getBindingContext().sPath;
            if (sPath) {
                sPath = sPath + "/" + sProperty;
                this._oDataModel.setProperty(sPath, oEvent.getParameter("value"));
            }
        },

        onSave: function () {
            var that = this;
            var bEvent = "SAVE";
            let postDocs = this.preparePostBody();
            this._BusyDialog.open();
            var aPromise = [];
            aPromise.push(this.callAction(postDocs, bEvent));

            Promise.all(aPromise).then((oData) => {

                oData.forEach((item) => {
                    let result = JSON.parse(item["processLogic"].Zzkey);
                    result.forEach(function (line) {
                        if (line.STATUS === 'S') {
                            MessageBox.success(line.MESSAGE);
                        } else {
                            MessageBox.error(line.MESSAGE);
                        }
                    });
                });


            }).catch((error) => {
                MessageBox.error(error.message);
            }).finally(() => {
                this._BusyDialog.close();
            });

        },

        preparePostBody: function () {
            var that = this;
            var listItems = this.byId("ReportTable").getSelectedIndices(); // get selected rows
            var selectedRows = [];
            listItems.forEach((item) => {
                var sPath = this.byId("ReportTable").getContextByIndex(item).getPath();
                var oRow = this.getModel().getObject(sPath);
                delete oRow.__metadata;
                selectedRows.push(oRow);
            });

            let postDocs = [JSON.stringify(selectedRows)];
            return postDocs;
        },

        callAction: function (postData, bEvent) {
            let aLTEXT1 = this.byId("idPeriodType").getSelectedKey();
            let aLTEXT2 = this.byId("idAcceptPeriod").getSelectedKey();
            return new Promise(
                function (resolve, reject) {
                    var mParameter = {
                        success: function (oData, response) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            resolve(reject);
                        },
                        method: "POST",
                        urlParameters: {
                            Zzkey: postData,
                            Ztype: "1",  //第一页面的保存
                            Event: bEvent,
                            PeriodType: aLTEXT1,
                            AcceptPeriod: aLTEXT2
                        }
                    };

                    this.getModel().callFunction("/processLogic", mParameter);
                }.bind(this)

            );
        },

        onGroup: function (oEvent) {
            var oFilters = this.byId("smartFilterBar").getFilters();
            var aFilters = [];
            aFilters.push(oFilters[0]);
            var aLTEXT1 = this.byId("idPeriodType").getSelectedKey();
            aFilters.push(new Filter("PeriodType", FilterOperator.EQ, aLTEXT1));
            var aLTEXT2 = this.byId("idAcceptPeriod").getSelectedKey();
            aFilters.push(new Filter("AcceptPeriod", FilterOperator.EQ, aLTEXT2));
            aFilters.push(new Filter("Layer", FilterOperator.EQ, "2"));

            // 跳转并传递选中的所有行数据
            this.getRouter().navTo("Group", {
                allData: JSON.stringify(aFilters) // 将数据传递到目标页面
            });
        },

    });
});