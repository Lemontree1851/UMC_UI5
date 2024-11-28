sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
],
    function (Controller, Filter, FilterOperator, BusyDialog, MessageBox) {
        "use strict";

        return Controller.extend("sd.salesdocumentreport.controller.Main", {

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();

            },

            onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
                var mBindingParams = oEvent.getParameter("bindingParams");

                var newfilter;


                var oSelect = this.byId("idplantype"); // 通过ID获取Select控件
                var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                newfilter = new sap.ui.model.Filter("plantype", sap.ui.model.FilterOperator.EQ, selectedKey);
                mBindingParams.filters.push(newfilter);

            }
        });

    });

