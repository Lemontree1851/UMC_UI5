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

            var aLTEXT2 = this.byId("idAcceptPeriod").getSelectedKey();
            var oAcceptPeriod = new sap.ui.model.Filter({
                path: "AcceptPeriod",
                operator: "EQ",
                value1: aLTEXT2
            });
            filters.push(oAcceptPeriod);

            var oLayer = new sap.ui.model.Filter({
                path: "Layer",
                operator: "EQ",
                value1: "2"
            });
            filters.push(oLayer);

            var oBinding = oEvent.getParameter("bindingParams");
            oBinding.events = {
                "dataReceived": function (oEvent) {
                    var oReceivedData = oEvent.getParameter('data');
                    var iCount = 0;
                    oReceivedData.results.forEach(function (line) {
                       if (line.SalesDocument !== ""){
                          iCount = iCount + 1;
                       }
                    });
                    var headerText = this.getModel("i18n").getResourceBundle().getText("groupHeaderTitle", [iCount]);
                    // 更新 SmartTable 的 header 文本
                    this.setHeader(headerText);
                },
              };
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
                            periodtype: aLTEXT1,
                            acceptperiod: aLTEXT2
                        }
                    };

                    this.getModel().callFunction("/processLogic", mParameter);
                }.bind(this)

            );
        },

    });
});