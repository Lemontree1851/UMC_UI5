sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],
function (Base,formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Base.extend("bi.costanalysis.controller.Main", {

 
        formatter: formatter,
        onInit: function () {

        },
        onSearch: function () {
            this.getModel().resetChanges();
        },




    });
});
