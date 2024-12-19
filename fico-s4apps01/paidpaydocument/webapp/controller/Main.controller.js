sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
],
    function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox) {
        "use strict";

        return Base.extend("fico.paidpaydocument.controller.Main", {
            formatter: formatter,

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._BusyDialog = new BusyDialog();
            },

            onButtonSelect: function (oEvent) {
                var sOption1 = this.byId("Option1").getSelected();
                if (sOption1 === true) {
                    this.byId("ProfitCenter").setVisible(true);
                    this.byId("ProfitCenterName").setVisible(true);
                    this.byId("PurchasingGroup").setVisible(true);
                    this.byId("PurGrpAmount").setVisible(true);
                    this.byId("ChargeableAmount").setVisible(true);
                    this.byId("ChargeableRate").setVisible(true);
                    this.byId("PreviousStockAmount").setVisible(true);
                    this.byId("CurrentStockAmount").setVisible(true);
                    this.byId("CurrentStockSemi").setVisible(true);
                    this.byId("CurrentStockFin").setVisible(true);
                    this.byId("CurrentStockTotal").setVisible(true);
                    this.byId("StockChangeAmount").setVisible(true);
                    this.byId("PaidMaterialCost").setVisible(true);
                    this.byId("CustomerRevenue").setVisible(true);
                    this.byId("Revenue").setVisible(true);
                    this.byId("RevenueRate").setVisible(true);
                    this.byId("Gjahr1").setVisible(true);
                    this.byId("Belnr1").setVisible(true);
                    this.byId("Gjahr2").setVisible(true);
                    this.byId("Belnr2").setVisible(true);
                    this.byId("Gjahr3").setVisible(true);
                    this.byId("Belnr3").setVisible(true);
                    this.byId("Gjahr4").setVisible(true);
                    this.byId("Belnr4").setVisible(true);

                    this.byId("AP").setVisible(false);
                    this.byId("AR").setVisible(false);
                    this.byId("Gjahr5").setVisible(false);
                    this.byId("Belnr5").setVisible(false);
                    this.byId("Gjahr6").setVisible(false);
                    this.byId("Belnr6").setVisible(false);
                    this.byId("Gjahr7").setVisible(false);
                    this.byId("Belnr7").setVisible(false);
                    this.byId("Gjahr8").setVisible(false);
                    this.byId("Belnr8").setVisible(false);
                } else {
                    this.byId("ProfitCenter").setVisible(false);
                    this.byId("ProfitCenterName").setVisible(false);
                    this.byId("PurchasingGroup").setVisible(false);
                    this.byId("PurGrpAmount").setVisible(false);
                    this.byId("ChargeableAmount").setVisible(false);
                    this.byId("ChargeableRate").setVisible(false);
                    this.byId("PreviousStockAmount").setVisible(false);
                    this.byId("CurrentStockAmount").setVisible(false);
                    this.byId("CurrentStockSemi").setVisible(false);
                    this.byId("CurrentStockFin").setVisible(false);
                    this.byId("CurrentStockTotal").setVisible(false);
                    this.byId("StockChangeAmount").setVisible(false);
                    this.byId("PaidMaterialCost").setVisible(false);
                    this.byId("CustomerRevenue").setVisible(false);
                    this.byId("Revenue").setVisible(false);
                    this.byId("RevenueRate").setVisible(false);
                    this.byId("Gjahr1").setVisible(false);
                    this.byId("Belnr1").setVisible(false);
                    this.byId("Gjahr2").setVisible(false);
                    this.byId("Belnr2").setVisible(false);
                    this.byId("Gjahr3").setVisible(false);
                    this.byId("Belnr3").setVisible(false);
                    this.byId("Gjahr4").setVisible(false);
                    this.byId("Belnr4").setVisible(false);

                    this.byId("AP").setVisible(true);
                    this.byId("AR").setVisible(true);
                    this.byId("Gjahr5").setVisible(true);
                    this.byId("Belnr5").setVisible(true);
                    this.byId("Gjahr6").setVisible(true);
                    this.byId("Belnr6").setVisible(true);
                    this.byId("Gjahr7").setVisible(true);
                    this.byId("Belnr7").setVisible(true);
                    this.byId("Gjahr8").setVisible(true);
                    this.byId("Belnr8").setVisible(true);
                }
            },

            onBeforeRebindTable: function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams");

                var oGjahr = new Date(this.byId("idGjahr").getValue());
                var oGjahrFilter = new sap.ui.model.Filter("FiscalYear", sap.ui.model.FilterOperator.EQ, oGjahr.getFullYear());
                mBindingParams.filters.push(oGjahrFilter);

                var sMonat = this.byId("idMonat").getSelectedKey();
                var oMonatFilter = new sap.ui.model.Filter("Period", sap.ui.model.FilterOperator.EQ, sMonat);
                mBindingParams.filters.push(oMonatFilter);

                var sOption1 = this.byId("Option1").getSelected();
                var newFilter;
                if (sOption1 === true) {
                    newFilter = new sap.ui.model.Filter("Ztype", sap.ui.model.FilterOperator.EQ, "A");
                } else {
                    newFilter = new sap.ui.model.Filter("Ztype", sap.ui.model.FilterOperator.EQ, "B");
                }
                mBindingParams.filters.push(newFilter);
            },

            onPost: function (oEvent) {
                var that = this;
                var bEvent = "POST";
                var sOption1 = this.byId("Option1").getSelected();
                if (sOption1 === true) {
                    var sType = "A";
                } else {
                    var sType = "B";
                }
                var sBukrs = this.getView().byId("SFBDocument").getControlByKey("CompanyCode").getValue();
                var sYear = new Date(this.byId("idGjahr").getValue()).getFullYear();
                var sMonat = this.byId("idMonat").getSelectedKey();
                if (sBukrs === 0 || sBukrs === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputBukrs"));
                    return;
                };

                if (sYear === 0 || sYear === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputYear"));
                    return;
                };

                if (sMonat === 0 || sMonat === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputMonat"));
                    return;
                };

                let postDocs = this.preparePostBody();
                this._BusyDialog.open();
                var aPromise = [];
                aPromise.push(this.postAction(postDocs, sType, bEvent, sYear, sMonat));

                Promise.all(aPromise).then((oData) => {
                    if (sType === "A") {
                        oData.forEach((item) => {
                            let result = JSON.parse(item["processLogic"].Zzkey);
                            result.forEach(function (line) {
                                let sPath = that.getModel().createKey("/PaidPayDocument", {
                                    CompanyCode: line.COMPANYCODE,
                                    FiscalYear: line.FISCALYEAR,
                                    Period: line.PERIOD,
                                    Customer: line.CUSTOMER,
                                    Supplier: line.SUPPLIER,
                                    ProfitCenter: line.PROFITCENTER,
                                    PurchasingGroup: line.PURCHASINGGROUP
                                });
                                that.getModel().setProperty(sPath + "/Belnr1", line.BELNR1);
                                that.getModel().setProperty(sPath + "/Gjahr1", line.GJAHR1);
                                that.getModel().setProperty(sPath + "/Belnr2", line.BELNR2);
                                that.getModel().setProperty(sPath + "/Gjahr2", line.GJAHR2);
                                that.getModel().setProperty(sPath + "/Belnr3", line.BELNR3);
                                that.getModel().setProperty(sPath + "/Gjahr3", line.GJAHR3);
                                that.getModel().setProperty(sPath + "/Belnr4", line.BELNR4);
                                that.getModel().setProperty(sPath + "/Gjahr4", line.GJAHR4);
                                that.getModel().setProperty(sPath + "/Status", line.STATUS);
                                that.getModel().setProperty(sPath + "/Message", line.MESSAGE);
                            });
                        });

                    } else {

                        oData.forEach((item) => {
                            let result = JSON.parse(item["processLogic"].Zzkey);
                            result.forEach(function (line) {
                                let sPath = that.getModel().createKey("/PaidPayDocument", {
                                    CompanyCode: line.COMPANYCODE,
                                    FiscalYear: line.FISCALYEAR,
                                    Period: line.PERIOD,
                                    Customer: line.CUSTOMER,
                                    Supplier: line.SUPPLIER
                                });
                                that.getModel().setProperty(sPath + "/Belnr5", line.BELNR5);
                                that.getModel().setProperty(sPath + "/Gjahr5", line.GJAHR5);
                                that.getModel().setProperty(sPath + "/Belnr6", line.BELNR6);
                                that.getModel().setProperty(sPath + "/Gjahr6", line.GJAHR6);
                                that.getModel().setProperty(sPath + "/Belnr7", line.BELNR7);
                                that.getModel().setProperty(sPath + "/Gjahr7", line.GJAHR7);
                                that.getModel().setProperty(sPath + "/Belnr8", line.BELNR8);
                                that.getModel().setProperty(sPath + "/Gjahr8", line.GJAHR8);
                                that.getModel().setProperty(sPath + "/Status", line.STATUS);
                                that.getModel().setProperty(sPath + "/Message", line.MESSAGE);
                            });
                        });

                    }

                }).catch((error) => {
                    MessageBox.error(error.message);
                }).finally(() => {
                    this._BusyDialog.close();
                });


            },
            preparePostBody: function () {
                var that = this;
                var listItems = this.byId("Table_Doc").getSelectedIndices(); // get selected rows
                var selectedRows = [];
                listItems.forEach((item) => {
                    var sPath = this.byId("Table_Doc").getContextByIndex(item).getPath();
                    var oRow = this.getModel().getObject(sPath);
                    delete oRow.__metadata;
                    //selectedRows.push(this.byId("Table_Doc").getContextByIndex(item));
                    selectedRows.push(oRow);
                });

                let postDocs = [JSON.stringify(selectedRows)];
                return postDocs;
            },

            postAction: function (postData, sType, bEvent,sYear, sMonat) {
                var oModel = this._oDataModel;

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
                                FiscalYear: sYear,
                                Period: sMonat,
                                Event: bEvent,
                                Ztype: sType
                            }
                        };
                        // Deep Create
                        this.getModel().callFunction("/processLogic", mParameter);
                    }.bind(this)

                );

            },

            onCancel: function (oEvent) {
                var that = this;
                var bEvent = "CANCEL";
                var sOption1 = this.byId("Option1").getSelected();
                if (sOption1 === true) {
                    var sType = "A";
                } else {
                    var sType = "B";
                }
                var sBukrs = this.getView().byId("SFBCalculation").getControlByKey("CompanyCode").getValue();
                var sYear = new Date(this.byId("idGjahr").getValue()).getFullYear();
                var sMonat = this.byId("idMonat").getSelectedKey();
                if (sBukrs === 0 || sBukrs === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputBukrs"));
                    return;
                };

                if (sYear === 0 || sYear === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputYear"));
                    return;
                };

                if (sMonat === 0 || sMonat === "") {
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("msgInputMonat"));
                    return;
                };

                let postDocs = this.preparePostBody();
                this.setBusy(true);
                var aPromise = [];
                aPromise.push(this.postAction(postDocs, sType, bEvent));

                Promise.all(aPromise).then((oData) => {
                    if (sType === "A") {
                        oData.forEach((item) => {
                            let result = JSON.parse(item["processLogic"].Zzkey);
                            result.forEach(function (line) {
                                let sPath = that.getModel().createKey("/PaidPayDocument", {
                                    CompanyCode: line.COMPANYCODE,
                                    FiscalYear: line.FISCALYEAR,
                                    Period: line.PERIOD,
                                    Customer: line.CUSTOMER,
                                    Supplier: line.SUPPLIER,
                                    ProfitCenter: line.PROFITCENTER,
                                    PurchasingGroup: line.PURCHASINGGROUP
                                });
                                that.getModel().setProperty(sPath + "/Belnr1", line.BELNR1);
                                that.getModel().setProperty(sPath + "/Gjahr1", line.GJAHR1);
                                that.getModel().setProperty(sPath + "/Belnr2", line.BELNR2);
                                that.getModel().setProperty(sPath + "/Gjahr2", line.GJAHR2);
                                that.getModel().setProperty(sPath + "/Belnr3", line.BELNR3);
                                that.getModel().setProperty(sPath + "/Gjahr3", line.GJAHR3);
                                that.getModel().setProperty(sPath + "/Belnr4", line.BELNR4);
                                that.getModel().setProperty(sPath + "/Gjahr4", line.GJAHR4);
                                that.getModel().setProperty(sPath + "/Status", line.STATUS);
                                that.getModel().setProperty(sPath + "/Message", line.MESSAGE);
                            });
                        });

                    } else {

                        oData.forEach((item) => {
                            let result = JSON.parse(item["processLogic"].Zzkey);
                            result.forEach(function (line) {
                                let sPath = that.getModel().createKey("/PaidPayDocument", {
                                    CompanyCode: line.COMPANYCODE,
                                    FiscalYear: line.FISCALYEAR,
                                    Period: line.PERIOD,
                                    Customer: line.CUSTOMER,
                                    Supplier: line.SUPPLIER
                                });
                                that.getModel().setProperty(sPath + "/Belnr5", line.BELNR5);
                                that.getModel().setProperty(sPath + "/Gjahr5", line.GJAHR5);
                                that.getModel().setProperty(sPath + "/Belnr6", line.BELNR6);
                                that.getModel().setProperty(sPath + "/Gjahr6", line.GJAHR6);
                                that.getModel().setProperty(sPath + "/Belnr7", line.BELNR7);
                                that.getModel().setProperty(sPath + "/Gjahr7", line.GJAHR7);
                                that.getModel().setProperty(sPath + "/Belnr8", line.BELNR8);
                                that.getModel().setProperty(sPath + "/Gjahr8", line.GJAHR8);
                                that.getModel().setProperty(sPath + "/Status", line.STATUS);
                                that.getModel().setProperty(sPath + "/Message", line.MESSAGE);
                            });
                        });

                    }

                }).catch((error) => {
                    MessageBox.error(error.message);
                }).finally(() => {
                    this._BusyDialog.close();
                });

            },
        });
    });
