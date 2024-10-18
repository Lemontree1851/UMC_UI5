sap.ui.define([
    "./formatter",
    "sap/m/BusyDialog",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (formatter, BusyDialog, Fragment, MessageBox, MessageToast) {
    'use strict';

    return {

        formatter: formatter,

        onInit: function (oEvent) {
            var that = this;
            this._myBusyDialog = new BusyDialog();
            // *************************************************
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                subtitle: '{subtitle}',
                counter: 1
            });
            this._myMessageView = new sap.m.MessageView({
                showDetailsPageHeader: false,
                itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "/MessageItems",
                    template: oMessageTemplate
                }
            });
            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    that._myMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            this._myMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: this._myMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        that._myMessageDialog.close();
                    },
                    text: "{i18n>CloseBtn}"
                }),
                customHeader: new sap.m.Bar({
                    contentLeft: [oBackButton],
                    contentMiddle: [
                        new sap.m.Title({
                            text: "{i18n>Results}",
                            level: "H1"
                        })
                    ]
                }),
                contentHeight: "50%",
                contentWidth: "30%",
                verticalScrolling: false
            });
            // *************************************************
        },

        onAssignSalesOrder: function (oEvent) {
            // Button -> ToolBar -> Table
            var sBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
            this._oBindingData = this.getView().getModel().getProperty(sBindingPath);
            if (parseFloat(this._oBindingData.AvailableAssignQty) === 0) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("Message1"));
            } else {
                this._getSalesOrderList();
            }
        },

        onChangeAssignQty: function (oEvent) {
            var sBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
            var oBindingData = this.getView().getModel().getProperty(sBindingPath);
            var aSelectedContextPaths = oEvent.getSource().getParent().getParent().getSelectedContextPaths();
            // single select
            var oRow = this.getView().getModel().getProperty(aSelectedContextPaths[0]);
            var oRowCopy = JSON.parse(JSON.stringify(oRow))
            this.getView().getModel("local").setProperty("/SelectedItem", oRowCopy);
            this._iMaxQuantity = parseFloat(oBindingData.AvailableAssignQty) + parseFloat(oRow.AssignQty);
            this._showDialog("ChangeAssignQty");
        },

        onChangeAssignMaterial: function (oEvent) {
            MessageToast.show("Custom handler invoked.");
        },

        onChangeAssignSalesOrder: function (oEvent) {
            MessageToast.show("Custom handler invoked.");
        },

        onDeleteSOItem: function (oEvent) {
            MessageToast.show("Custom handler invoked.");
        },

        _getSalesOrderList: function () {
            this._CallODataV2("ACTION", "/getSalesOrderList", [], {
                "Event": "",
                "Zzkey": JSON.stringify({
                    Material: this._oBindingData.Material,
                    AvailableAssignQty: this._oBindingData.AvailableAssignQty
                }),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.getSalesOrderList.Zzkey);
                this.getView().getModel("local").setProperty("/SalesOrderList", result);
                // this.showSalesOrderListDialog();
                this._showDialog("SalesOrderList");
            }.bind(this));
        },

        _showDialog: function (sFragmentName) {
            var that = this;
            this._myBusyDialog.open();
            Fragment.load({
                name: "pp.zmfgorderassignso.ext.fragments." + sFragmentName,
                controller: this
            }).then(function (oDialog) {
                //ダイアログがロードされたら
                this._oDialog = oDialog;
                //ダイアログからモデルを使用できるようにする
                this.getView().addDependent(this._oDialog);
                this._oDialog.addButton(new sap.m.Button({
                    text: "{i18n>SaveBtn}",
                    press: function () {
                        switch (sFragmentName) {
                            case "SalesOrderList":
                                that._saveAssignSalesOrder();
                            case "ChangeAssignQty":
                                that._saveChangeAssignQty();
                                break;
                            default:
                                break;
                        }
                    }
                }));
                this._oDialog.addButton(new sap.m.Button({
                    text: "{i18n>CloseBtn}",
                    press: function () {
                        that._oDialog.destroy();
                    }
                }));
                this._myBusyDialog.close();
                this._oDialog.open();
            }.bind(this));
        },

        _saveAssignSalesOrder: function () {
            var aMessageItems = [];
            var aRequestData = [];
            var iSumAssignQty = 0;
            var aSalesOrderList = this.getView().getModel("local").getProperty("/SalesOrderList");
            aSalesOrderList.forEach(element => {
                if (parseFloat(element.AssignQty) > 0) {
                    aRequestData.push({
                        SalesOrder: element.SalesOrder,
                        SalesOrderItem: element.SalesOrderItem, // string
                        SalesOrderItemI: element.SalesOrderItemI, // numc
                        AssignQty: element.AssignQty
                    });
                    iSumAssignQty += parseFloat(element.AssignQty);

                    if (parseFloat(element.AssignQty) > parseFloat(element.UnAssignQty)) {
                        aMessageItems.push({
                            type: "Error",
                            title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                            description: this.getView().getModel("i18n").getResourceBundle().getText("Message2", [element.SalesOrder, element.SalesOrderItem]),
                            subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message2", [element.SalesOrder, element.SalesOrderItem])
                        });
                    }
                }
            });
            if (iSumAssignQty > parseFloat(this._oBindingData.AvailableAssignQty)) {
                aMessageItems.push({
                    type: "Error",
                    title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                    description: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)]),
                    subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)])
                });
            }
            if (aMessageItems.length > 0) {
                this.showMessageDialog(aMessageItems);
                return;
            }
            var oRequestData = {
                ProductionPlant: this._oBindingData.ProductionPlant,
                ManufacturingOrder: this._oBindingData.ManufacturingOrder,
                Items: aRequestData
            };
            this._CallODataV2("ACTION", "/saveAssignSalesOrder", [], {
                "Event": "",
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.saveAssignSalesOrder.Zzkey);
                result.MessageItems.forEach(element => {
                    aMessageItems.push({
                        type: element.Type,
                        title: element.Title,
                        description: element.Description,
                        subtitle: element.Subtitle
                    });
                });
                if (aMessageItems.length > 0) {
                    this.showMessageDialog(aMessageItems);
                } else {
                    this._oDialog.destroy();
                    this.getView().getModel().refresh();
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }
            }.bind(this));
        },

        _saveChangeAssignQty: function () {
            var aMessageItems = [];
            var oRow = this.getView().getModel("local").getProperty("/SelectedItem");
            if (parseInt(oRow.AssignQty) > parseInt(oRow.RequestedQuantityInBaseUnit)) {
                aMessageItems.push({
                    type: "Error",
                    title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                    description: this.getView().getModel("i18n").getResourceBundle().getText("Message4", [oRow.SalesOrder, oRow.SalesOrderItem]),
                    subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message4", [oRow.SalesOrder, oRow.SalesOrderItem])
                });
            }
            if (parseInt(oRow.AssignQty) > this._iMaxQuantity) {
                aMessageItems.push({
                    type: "Error",
                    title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                    description: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [parseInt(oRow.AssignQty), this._iMaxQuantity]),
                    subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [parseInt(oRow.AssignQty), this._iMaxQuantity])
                });
            }
            if (aMessageItems.length > 0) {
                this.showMessageDialog(aMessageItems);
                return;
            }
            var oRequestData = {
                Items: [{
                    Plant: oRow.Plant,
                    ManufacturingOrder: oRow.ManufacturingOrder,
                    SalesOrder: oRow.SalesOrder,
                    SalesOrderItem: oRow.SalesOrderItem,
                    Material: oRow.Material,
                    AssignQty: oRow.AssignQty,
                }]
            };
            this._CallODataV2("ACTION", "/saveChangeAssignQty", [], {
                "Event": "",
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.saveChangeAssignQty.Zzkey);
                result.MessageItems.forEach(element => {
                    aMessageItems.push({
                        type: element.Type,
                        title: element.Title,
                        description: element.Description,
                        subtitle: element.Subtitle
                    });
                });
                if (aMessageItems.length > 0) {
                    this.showMessageDialog(aMessageItems);
                } else {
                    this._oDialog.destroy();
                    this.getView().getModel().refresh();
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }
            }.bind(this));
        },

        showMessageDialog: function (aMessageItems) {
            this.getView().getModel("local").setProperty("/MessageItems", aMessageItems);
            this._myMessageView.setModel(this.getView().getModel("local"));
            this._myMessageView.navigateBack();
            this.getView().addDependent(this._myMessageDialog);
            this._myMessageDialog.open();
        },

        _CallODataV2: function (sMethod, sPath, aFilters, mUrlParameter, oRequestData) {
            var that = this;
            this._myBusyDialog.open();
            return new Promise(function (resolve, reject) {
                var mParameters = {
                    method: sMethod === "READ" ? "GET" : "POST",
                    filters: aFilters,
                    urlParameters: mUrlParameter,
                    success: function (oResponse) {
                        that._myBusyDialog.close();
                        resolve(oResponse);
                    },
                    error: function (oErr) {
                        that._myBusyDialog.close();
                        var oError = JSON.parse(oErr.responseText);
                        var sMsg;
                        if (oError.error.innererror.errordetails.length > 0) {
                            sMsg = oError.error.innererror.errordetails[0].message;
                        } else {
                            sMsg = oError.error.message.value;
                        }
                        MessageBox.error(sMsg);
                        reject();
                    }
                };
                switch (sMethod) {
                    case "READ":
                        that.getView().getModel().read(sPath, mParameters);
                        break;
                    case "CREATE":
                        that.getView().getModel().create(sPath, oRequestData, mParameters);
                        break;
                    case "UPDATE":
                        that.getView().getModel().update(sPath, oRequestData, mParameters);
                        break;
                    case "DELETE":
                        that.getView().getModel().remove(sPath, mParameters);
                        break;
                    case "ACTION":
                        that.getView().getModel().callFunction(sPath, mParameters);
                        break;
                    default:
                        break;
                }
            });
        }
    };
});