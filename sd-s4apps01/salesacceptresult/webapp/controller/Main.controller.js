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