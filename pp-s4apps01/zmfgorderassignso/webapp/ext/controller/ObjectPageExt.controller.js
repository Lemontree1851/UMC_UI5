sap.ui.define([
    "sap/ui/core/routing/History",
    "./ValueHelpDialog",
    "./formatter",
    "sap/m/BusyDialog",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (History, ValueHelpDialog, formatter, BusyDialog, Fragment, MessageBox, MessageToast) {
    'use strict';

    return {
        ValueHelpDialog: ValueHelpDialog,
        formatter: formatter,

        onInit: function () {
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

        // 受注割当
        onAssignSalesOrder: function (oEvent) {
            // Button -> ToolBar -> Table
            var sBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
            this._oBindingData = this.getView().getModel().getProperty(sBindingPath);
            if (parseFloat(this._oBindingData.AvailableAssignQty) === 0) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("Message1"));
            } else {
                this._getSalesOrderList("AssignSalesOrder", "SalesOrderList", this._oBindingData.Material, this._oBindingData.AvailableAssignQty);
            }
        },

        // 割当数変更
        onChangeAssignQty: function (oEvent) {
            this._getSelectedRowData(oEvent);
            this._showDialog("ChangeAssignQty", "ChangeAssignQty");
        },

        // 割当品目変更
        onChangeAssignMaterial: function (oEvent) {
            this._getSelectedRowData(oEvent);
            this._showDialog("ChangeAssignMaterial", "ChangeAssignMaterial");
        },

        // 割当受注変更
        onChangeAssignSalesOrder: function (oEvent) {
            this._getSelectedRowData(oEvent);
            var sMaterial = this.getView().getModel("local").getProperty("/SelectedItem/Material");
            var sAssignQty = this.getView().getModel("local").getProperty("/SelectedItem/AssignQty");
            // this._getSalesOrderList("ChangeAssignSalesOrder", "SalesOrderList", sMaterial, this._iMaxQuantity);
            this._getSalesOrderList("ChangeAssignSalesOrder", "SalesOrderList", sMaterial, parseFloat(sAssignQty));
        },

        // 削除
        onDeleteSOItem: function (oEvent) {
            var that = this;
            var sTitle = this.getView().getModel("i18n").getResourceBundle().getText("DeleteSOItem");
            this._getSelectedRowData(oEvent);
            MessageBox.confirm(this.getView().getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oRow = that.getView().getModel("local").getProperty("/SelectedItem");
                        var oRequestData = {
                            Items: [{
                                Plant: oRow.Plant,
                                ManufacturingOrder: oRow.ManufacturingOrder,
                                SalesOrder: oRow.SalesOrder,
                                SalesOrderItem: oRow.SalesOrderItem,
                                Sequence: oRow.Sequence
                            }]
                        };
                        that._CallODataV2("ACTION", "/deleteSOItem", [], {
                            "Event": "",
                            "Zzkey": JSON.stringify(oRequestData),
                            "RecordUUID": ""
                        }, {}).then(function (oResponse) {
                            var aMessageItems = [];
                            var result = JSON.parse(oResponse.deleteSOItem.Zzkey);
                            result.MessageItems.forEach(element => {
                                aMessageItems.push({
                                    type: element.Type,
                                    title: element.Title,
                                    description: element.Description,
                                    subtitle: element.Subtitle
                                });
                            });
                            if (aMessageItems.length > 0) {
                                that._showMessageDialog(aMessageItems);
                            } else {
                                that.getView().getModel().refresh();
                                that._navBackMain();
                                MessageToast.show(that.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                            }
                        }.bind(that));
                    }
                },
                dependentOn: this.getView()
            });
        },

        handleChange: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            if (sValue) {
                if (parseFloat(sValue) < 0) {
                    this.getView().getModel("local").setProperty("/visibleSave", false);
                } else {
                    this.getView().getModel("local").setProperty("/visibleSave", true);
                }
            } else {
                oEvent.getSource().setValue(0);
            }
        },

        _getSelectedRowData: function (oEvent) {
            var sBindingPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
            var oBindingData = this.getView().getModel().getProperty(sBindingPath);
            var aSelectedContextPaths = oEvent.getSource().getParent().getParent().getSelectedContextPaths();
            // single select
            var oRow = this.getView().getModel().getProperty(aSelectedContextPaths[0]);
            var oRowCopy = JSON.parse(JSON.stringify(oRow))
            this.getView().getModel("local").setProperty("/SelectedItem", oRowCopy);
            this._iMaxQuantity = parseFloat(oBindingData.AvailableAssignQty) + parseFloat(oRow.AssignQty);
        },

        _getSalesOrderList: function (sEvent, sFragmentName, sMaterial, iAvailableAssignQty) {
            this._CallODataV2("ACTION", "/getSalesOrderList", [], {
                "Event": "",
                "Zzkey": JSON.stringify({
                    Material: sMaterial,
                    AvailableAssignQty: iAvailableAssignQty
                }),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.getSalesOrderList.Zzkey);
                this.getView().getModel("local").setProperty("/SalesOrderList", result);
                this._showDialog(sEvent, sFragmentName);
            }.bind(this));
        },

        _showDialog: function (sEvent, sFragmentName) {
            var that = this;
            this._myBusyDialog.open();
            this.getView().getModel("local").setProperty("/visibleSave", true);
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
                    visible: "{local>/visibleSave}",
                    press: function () {
                        switch (sEvent) {
                            case "AssignSalesOrder":
                                that._saveAssignSalesOrder();
                                break;
                            case "ChangeAssignQty":
                                that._saveChange(sEvent);
                                break;
                            case "ChangeAssignMaterial":
                                that._saveChange(sEvent);
                                break;
                            case "ChangeAssignSalesOrder":
                                that._saveChangeAssignSalesOrder();
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
            // if (iSumAssignQty > parseFloat(this._oBindingData.AvailableAssignQty)) {
            //     aMessageItems.push({
            //         type: "Error",
            //         title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
            //         description: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)]),
            //         subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message3", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)])
            //     });
            // } else 
            if (iSumAssignQty !== parseFloat(this._oBindingData.AvailableAssignQty)) {
                aMessageItems.push({
                    type: "Error",
                    title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                    description: this.getView().getModel("i18n").getResourceBundle().getText("Message5", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)]),
                    subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message5", [iSumAssignQty, parseFloat(this._oBindingData.AvailableAssignQty)])
                });
            }
            if (aMessageItems.length > 0 || aRequestData.length === 0) {
                this._showMessageDialog(aMessageItems);
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
                    this._showMessageDialog(aMessageItems);
                } else {
                    this._oDialog.destroy();
                    this.getView().getModel().refresh();
                    this._navBackMain();
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }
            }.bind(this));
        },

        _saveChange: function (sEvent) {
            var aMessageItems = [];
            var oRow = this.getView().getModel("local").getProperty("/SelectedItem");
            if (sEvent === "ChangeAssignQty") {
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
                    this._showMessageDialog(aMessageItems);
                    return;
                }
            }
            var oRequestData = {
                Items: [{
                    Plant: oRow.Plant,
                    ManufacturingOrder: oRow.ManufacturingOrder,
                    SalesOrder: oRow.SalesOrder,
                    SalesOrderItem: oRow.SalesOrderItem,
                    Sequence: oRow.Sequence,
                    Material: oRow.Material,
                    AssignQty: oRow.AssignQty
                }]
            };
            this._CallODataV2("ACTION", "/saveChangeRow", [], {
                "Event": sEvent,
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.saveChangeRow.Zzkey);
                result.MessageItems.forEach(element => {
                    aMessageItems.push({
                        type: element.Type,
                        title: element.Title,
                        description: element.Description,
                        subtitle: element.Subtitle
                    });
                });
                if (aMessageItems.length > 0) {
                    this._showMessageDialog(aMessageItems);
                } else {
                    this._oDialog.destroy();
                    this.getView().getModel().refresh();
                    if (sEvent === "ChangeAssignMaterial") {
                        this._navBackMain();
                    }
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }
            }.bind(this));
        },

        _saveChangeAssignSalesOrder: function () {
            var aMessageItems = [];
            var aRequestData = [];
            var iSumAssignQty = 0;
            var oRow = this.getView().getModel("local").getProperty("/SelectedItem");
            var aSalesOrderList = this.getView().getModel("local").getProperty("/SalesOrderList");
            aRequestData.push({
                Plant: oRow.Plant,
                ManufacturingOrder: oRow.ManufacturingOrder,
                SalesOrder: oRow.SalesOrder,
                SalesOrderItem: oRow.SalesOrderItem, // string
                SalesOrderItemI: parseFloat(oRow.SalesOrderItem), // numc
                Sequence: oRow.Sequence,
                AssignQty: oRow.AssignQty
            });
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
            // if (iSumAssignQty > parseFloat(this._iMaxQuantity)) {
            if (iSumAssignQty !== oRow.AssignQty) {
                aMessageItems.push({
                    type: "Error",
                    title: this.getView().getModel("i18n").getResourceBundle().getText("Error"),
                    description: this.getView().getModel("i18n").getResourceBundle().getText("Message5", [iSumAssignQty, parseFloat(oRow.AssignQty)]),
                    subtitle: this.getView().getModel("i18n").getResourceBundle().getText("Message5", [iSumAssignQty, parseFloat(oRow.AssignQty)])
                });
            }
            if (aMessageItems.length > 0 || aRequestData.length === 1) {
                this._showMessageDialog(aMessageItems);
                return;
            }
            var oRequestData = {
                Items: aRequestData
            };
            this._CallODataV2("ACTION", "/saveChangeAssignSalesOrder", [], {
                "Event": "",
                "Zzkey": JSON.stringify(oRequestData),
                "RecordUUID": ""
            }, {}).then(function (oResponse) {
                var result = JSON.parse(oResponse.saveChangeAssignSalesOrder.Zzkey);
                result.MessageItems.forEach(element => {
                    aMessageItems.push({
                        type: element.Type,
                        title: element.Title,
                        description: element.Description,
                        subtitle: element.Subtitle
                    });
                });
                if (aMessageItems.length > 0) {
                    this._showMessageDialog(aMessageItems);
                } else {
                    this._oDialog.destroy();
                    this.getView().getModel().refresh();
                    this._navBackMain();
                    MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }
            }.bind(this));
        },

        _showMessageDialog: function (aMessageItems) {
            if (aMessageItems.length > 0) {
                this.getView().getModel("local").setProperty("/MessageItems", aMessageItems);
                this._myMessageView.setModel(this.getView().getModel("local"));
                this._myMessageView.navigateBack();
                this.getView().addDependent(this._myMessageDialog);
                this._myMessageDialog.open();
            }
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
        },

        /**
         * Convenience method for routing back and history
         * @public
         * @param {string} psTarget Parameter containing the string for the target navigation
         * @param {mapping} pmParameters? Parameters for navigation
         */
        _navBackMain() {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("Main", /*pmParameters*/{}, false);
            }
        }
    };
});