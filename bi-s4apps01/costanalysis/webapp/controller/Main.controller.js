sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (Base, formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Base.extend("bi.costanalysis.controller.Main", {

        formatter: formatter,

        onInit: function () {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "costanalysis-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "costanalysis-View")
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

        onSearch: function () {
            this.getModel().resetChanges();
            // // var oSearchBar = this.byId("idSmartFilterBar1");
            // // var oTable = this.byId("tablelist");
            // // var aFilters = oSearchBar.getFilters();

            // // var sYear = this.getModel("local").getProperty("/zYear");
            // // if (sYear) {
            // //     aFilters.push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));
            // // }
            // // var sMonth = this.getModel("local").getProperty("/zMonth");
            // // if (sMonth) {
            // // 	aFilters.push(new Filter("zMonth", FilterOperator.EQ, sMonth.getFullYear()));
            // // }

            // // // oSearchBar.getFilters().push(new Filter("zYear", FilterOperator.EQ, sYear.getFullYear()));
            // // this.byId("idSmartFilterBar1").setFilterData(aFilters,true);   

            // // var bFilters = oSearchBar.getFilters();
            // // var oFilterData = oSearchBar.getFilterData(); 

            // var filterData = this.byId("idSmartFilterBar1").getFilterData();
            // var sYear = this.getModel("local").getProperty("/zYear").getFullYear();
            // var oGjahr = "=" + sYear;
            // var condition = {exclude: false, operation: "EQ", keyField: "zYear", tokenText:oGjahr, value1:sYear, value2: null};
            // // if (filterData.zYear) {
            // //  filterData.zYear.ranges[0] = condition;
            // // } else {
            // //  filterData.zYear = {items: [], ranges:[condition], value: null};
            // // }
            // filterData.zYear = sYear;
            // this.byId("idSmartFilterBar1").setFilterData(filterData,true);    
            // // this.byId("idSmartFilterBar1").setFiltes  

            // var afilterData = this.byId("idSmartFilterBar1").getFilterData();
        },

        onBeforeRebindTable: function (oEvent) {
            if (this.getModel("local").getProperty("/zYear").length != 0) {
                var sYear = this.getModel("local").getProperty("/zYear").getFullYear();
                var oYear = { oValue1: sYear, oValue2: null, sOperator: "EQ", sPath: "zYear", _bMultiFilter: false };
                oEvent.getParameter("bindingParams").filters.push(oYear);
            }

            // if(this.getModel("local").getProperty("/zMonth").length != 0){
            //     var sMonth = this.getModel("local").getProperty("/zMonth").getMonth() + 1;
            //     var oMonth = {oValue1:sMonth, oValue2: null, sOperator: "EQ", sPath: "zMonth", _bMultiFilter:false};
            //     oEvent.getParameter("bindingParams").filters.push(oMonth);
            // } 

            if (this.getModel("local").getProperty("/selectIndex") == 0) {
                var oMonth = this.byId("sfbRep02SelFiscalMonth1");
                if (oMonth) {
                    var aMonth = oMonth.getSelectedKeys();
                    if (aMonth.length != 0) {
                        aMonth.forEach((e) => {
                            var oMonth = { oValue1: e, oValue2: null, sOperator: "EQ", sPath: "zMonth", _bMultiFilter: false };
                            oEvent.getParameter("bindingParams").filters.push(oMonth);
                        })
                    }
                }
            }
            else {
                var oMonth = this.byId("sfbRep02SelFiscalMonth2");
                if (oMonth) {
                    var aMonth = oMonth.getSelectedKeys();
                    if (aMonth.length != 0) {
                        aMonth.forEach((e) => {
                            var oMonth = { oValue1: e, oValue2: null, sOperator: "EQ", sPath: "zMonth", _bMultiFilter: false };

                            oEvent.getParameter("bindingParams").filters.push(oMonth);
                        })
                    }
                }
            }
        },
    });
});
