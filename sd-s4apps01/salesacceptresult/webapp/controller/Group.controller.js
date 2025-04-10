sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
], function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox) {
    "use strict";

    return Base.extend("sd.salesacceptresult.controller.Group", {
        formatter: formatter,

        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._BusyDialog = new BusyDialog();
            this.getRouter().getRoute("Group").attachMatched(this._initialize, this);

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Group").attachPatternMatched(this._onRouteMatched, this);

        },

        _onRouteMatched: function (oEvent) {
            // 获取传递的参数
            var sAllData = oEvent.getParameter("arguments").allData;
            var oFilter = JSON.parse(sAllData);  // 将过滤条件从 JSON 字符串解析为对象

            this._fetchData(oFilter);

            this._oDataModel.setRefreshAfterChange(false);
            this._oDataModel.refresh();
        },
        _fetchData: function (oFilter) {
            var oModel = this.getView().getModel().getData();
            var aFilters = [];

            for (var key in oFilter) {
                if (oFilter[key]) {
                    var oFilterItem = new sap.ui.model.Filter(key, sap.ui.model.FilterOperator.EQ, oFilter[key]);
                    aFilters.push(oFilterItem);
                }
            }
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
                        Finish: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptresult-Finish")
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

            var aYear = new Date(this.byId("idAcceptYear").getValue());
            var oAcceptYear = new sap.ui.model.Filter({
                path: "AcceptYear",
                operator: "EQ",
                value1: aYear.getFullYear()
            });
            filters.push(oAcceptYear);

            var oPeriodType = new sap.ui.model.Filter({
                path: "PeriodType",
                operator: "EQ",
                value1: aLTEXT1
            });
            filters.push(oPeriodType);

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
                value1: "2"
            });
            filters.push(oLayer);

            // ADD BEGIN BY XINLEI XU 2025/03/31
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            filters.push(new sap.ui.model.Filter("UserEmail", "EQ", sEmail));
            // ADD END BY XINLEI XU 2025/03/31

            var oBinding = oEvent.getParameter("bindingParams");
            oBinding.events = {
                "dataReceived": function (oEvent) {
                    var oReceivedData = oEvent.getParameter('data');
                    var iCount = 0;
                    oReceivedData.results.forEach(function (line) {
                        if (line.SalesDocument !== "") {
                            iCount = iCount + 1;
                        }
                    });
                    var headerText = this.getModel("i18n").getResourceBundle().getText("groupHeaderTitle", [iCount]);
                    // 更新 SmartTable 的 header 文本
                    this.setHeader(headerText);
                },
            };
        },

        onUITableRowsUpdated: function (oEvent) {
            var oTable = oEvent.getSource();
            var aRows = oTable.getRows();
            var sType = "";

            if (aRows && aRows.length > 0) {
                for (var i = 0; i < aRows.length; i++) {
                    var c1Cell = aRows[i].getCells()[0];
                    if (c1Cell) {
                        sType = c1Cell.getText();
                        if (sType === "差異ナシ" || sType === "処理済み" || sType === "処理待ち" || sType === "処理不要" || sType === "保留") {
                            $("#" + aRows[i].getId()).css("background-color", "#1E90FF");
                        }
                        else {
                            $("#" + aRows[i].getId()).css("background-color", "");
                        }

                    }
                }
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
            })

            let postDocs = [JSON.stringify(selectedRows)];
            return postDocs;
        },

        callAction: function (postData, bEvent) {
            let aLTEXT1 = this.byId("idPeriodType").getSelectedKey();
            let aLTEXT2 = this.byId("idAcceptPeriod").getSelectedKey();
            let aYear = new Date(this.byId("idAcceptYear").getValue());
            let aLText3 = aYear.getFullYear();
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
                            Ztype: "2",  //第二页面的保存
                            Event: bEvent,
                            PeriodType: aLTEXT1,
                            AcceptYear: aLText3,
                            AcceptPeriod: aLTEXT2
                        }
                    };

                    this.getModel().callFunction("/processLogic", mParameter);
                }.bind(this)

            );
        },

        onNavBack: function () {
            // Get the router and navigate to the first page
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Main", {}, true); // Replace true to clear the navigation history
        }


    });
});