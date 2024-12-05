sap.ui.define([
    "../controller/ValueHelpDialog",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (ValueHelpDialog, formatter, BusyDialog, MessageBox, Fragment, Filter, FilterOperator) {
    'use strict';

    var _myFunction, _myBusyDialog, _myMessageView, _myMessageDialog, _UserInfo;
    return {
        ValueHelpDialog: ValueHelpDialog,
        formatter: formatter,

        init: function () {
            _myFunction = sap.ui.require("pp/zmaterialrequisition/ext/controller/ListReportExt");
            _myBusyDialog = new BusyDialog();
            _UserInfo = sap.ushell.Container.getService("UserInfo");
            // *************************************************
            var oMessageTemplate = new sap.m.MessageItem({
                type: '{type}',
                title: '{title}',
                description: '{description}',
                subtitle: '{subtitle}',
                counter: 1
            });
            _myMessageView = new sap.m.MessageView({
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
                    _myMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            _myMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: _myMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        _myMessageDialog.close();
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

        openOperationDialog: function () {
            var that = this;
            this.getModel("local").setProperty("/headSet", {
                Plant: "",
                Type: "",
                MaterialRequisitionNo: "",
                HeaderCreatedDate: new Date(),
                CostCenter: "",
                CostCenterName: "",
                Customer: "",
                CustomerName: "",
                Receiver: "",
                RequisitionDate: new Date(),
                LineWarehouseStatus: false
            });
            this.getModel("local").setProperty("/itemSet", []);
            var sActionTitle1 = this.getModel("i18n").getResourceBundle().getText("Create");
            var sActionTitle2 = this.getModel("i18n").getResourceBundle().getText("Update");
            MessageBox.information(this.getModel("i18n").getResourceBundle().getText("selectOperation"), {
                actions: [sActionTitle1, sActionTitle2, MessageBox.Action.CLOSE],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.CLOSE) {
                        return;
                    }
                    if (sAction === sActionTitle1) {
                        that.getModel("local").setProperty("/mode", "create");
                    } else {
                        that.getModel("local").setProperty("/mode", "update");
                    }
                    _myBusyDialog.open();

                    var aFilters = [];
                    aFilters.push(new Filter({
                        path: "ZID",
                        operator: FilterOperator.EQ,
                        value1: "ZPP010"
                    }));
                    var oContextBinding = that.getModel().bindList("/ZC_TBC1001", undefined, undefined, aFilters, {});
                    oContextBinding.requestContexts().then(function (aContext) {
                        var aConfig = [];
                        for (const boundContext of aContext) {
                            var object = boundContext.getObject();
                            aConfig.push({
                                Plant: object.Zvalue1,
                                Amount: object.Zvalue2
                            });
                        }
                        that.getModel("local").setProperty("/Config", aConfig);

                        Fragment.load({
                            name: "pp.zmaterialrequisition.ext.fragments.Operation",
                            controller: that
                        }).then(function (oDialog) {
                            //ダイアログがロードされたら
                            that._oOperationDialog = oDialog;
                            //ダイアログからモデルを使用できるようにする
                            that.routing.getView().addDependent(that._oOperationDialog);
                            that._oOperationDialog.addButton(new sap.m.Button({
                                text: "{i18n>CloseBtn}",
                                press: function () {
                                    that.getModel("local").setProperty("/headSet", {});
                                    that.getModel("local").setProperty("/itemSet", []);
                                    that._oOperationDialog.destroy();
                                }
                            }));
                            _myBusyDialog.close();
                            that._oOperationDialog.open();
                        }.bind(that));

                    }.bind(that));
                },
                dependentOn: this.routing.getView()
            });
        },

        onSearch: function () {
            var that = this;
            var oControl = sap.ui.getCore().byId("idMaterialRequisitionNo");
            var sMaterialRequisitionNo = oControl.getValue();
            if (sMaterialRequisitionNo) {
                var oRequestData = {
                    header: {
                        MaterialRequisitionNo: sMaterialRequisitionNo
                    }
                }
                _myFunction._callOData("QUERY", oRequestData, that);
            } else {
                oControl.setValueState("Error");
            }
        },

        onSave: function (oEvent) {
            var that = this;
            var oTable = oEvent.getSource().getParent().getParent();
            var header = this.getModel("local").getProperty("/headSet");
            var items = this.getModel("local").getProperty("/itemSet");
            var aConfig = this.getModel("local").getProperty("/Config");
            var config = aConfig.find(element => element.Plant === header.Plant);
            items.forEach(item => {
                var iAmount = parseFloat(item.StandardPrice) * parseFloat(item.Quantity);
                item.DeleteFlag = iAmount >= parseFloat(config.Amount) ? "W" : "";
            });
            var oRequestData = {
                header: header,
                items: items,
                user: _UserInfo.getEmail() === undefined ? "" : _UserInfo.getEmail(),
                username: _UserInfo.getFullName() === undefined ? "" : _UserInfo.getFullName(),
                datetime: _myFunction._getCurrentDateTime()
            }
            if (!_myFunction._requiredFields(oTable, this)) {
                MessageBox.confirm(this.getModel("i18n").getResourceBundle().getText("confirmMessage", [this.getModel("i18n").getResourceBundle().getText("SaveBtn")]), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            _myFunction._callOData("SAVE", oRequestData, that);
                        }
                    },
                    dependentOn: this.routing.getView()
                });
            }
        },

        onAddLine: function () {
            var items = this.getModel("local").getProperty("/itemSet");
            var item = {
                ItemNo: 0,
                ManufacturingOrder: "",
                Product: "",
                Material: "",
                MaterialDescription: "",
                Quantity: "",
                BaseUnit: "",
                StorageLocation: "",
                StorageLocationName: "",
                Location: "",
                Remark: "",
                StandardPrice: "",
                TotalAmount: 0,
                Currency: "",
                OrderIsClosed: "",
                DeleteFlag: "",
                Status: "None"
            };
            items.push(item);
            items.forEach((line, index) => {
                line.ItemNo = (index + 1) * 10;
            });
            this.getModel("local").setProperty("/itemSet", items);
        },

        onUITableRowsUpdated: function (oEvent) {
            var oTable = oEvent.getSource();
            var aRows = oTable.getRows();
            var aConfig = this.getModel("local").getProperty("/Config");
            var sPlant = this.getModel("local").getProperty("/headSet/Plant");
            var config = aConfig.find(element => element.Plant === sPlant);
            if (config) {
                aRows.forEach(function (oRow, index) {
                    var sAmount = "0",
                        iAmount = 0;
                    oRow.getCells().forEach(oCell => {
                        if (oCell.mBindingInfos.text) {
                            if (oCell.mBindingInfos.text.parts[0].path === "TotalAmount") {
                                sAmount = oCell.getText().split(' ')[0];
                                iAmount = parseFloat(sAmount.replace(/,/g, ""));
                            }
                        }
                    });
                    if (iAmount >= parseFloat(config.Amount)) {
                        $("#" + oRow.getId()).css("background-color", "#f2bfc0");
                        $("#" + oRow.getId() + "-fixed").css("background-color", "#f2bfc0");
                    } else {
                        $("#" + oRow.getId()).css("background-color", "#fff");
                        $("#" + oRow.getId() + "-fixed").css("background-color", "#fff");
                    }
                });
            }
        },

        onDelLine: function (oEvent) {
            var oTable = oEvent.getSource().getParent().getParent();
            var aSelectedIndices = oTable.getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                return;
            }
            var items = this.getModel("local").getProperty("/itemSet");
            var iLen = aSelectedIndices.length - 1;
            do {
                items.splice(aSelectedIndices[iLen], 1);
                // begin: clear value state
                var oCells = oTable.getRows()[aSelectedIndices[0]].getCells();
                oCells.forEach(cell => {
                    if (cell.sId.includes("input")) {
                        cell.setValueState("None");
                    }
                });
                // end: clear value state
                iLen--;
            } while (iLen >= 0);
            items.forEach((line, index) => {
                line.ItemNo = (index + 1) * 10;
            });
            this.getModel("local").setProperty("/itemSet", items);
        },

        handleChange: function (oEvent) {
            var aFieldName = [];
            var sValue, sInputBindingPath, sODataPath, oContextBinding;
            this._oControl = oEvent.getSource();
            _myBusyDialog.open();
            switch (this._oControl.getMetadata().getName()) {
                case "sap.m.Input":
                    sValue = this._oControl.getValue();
                    sInputBindingPath = this._oControl.mBindingInfos.value.parts[0].path;
                    if (sInputBindingPath === 'Remark') {
                        if (sValue) {
                            this._oControl.setValueState("None");
                        } else {
                            this._oControl.setValueState("Error");
                        }
                        _myBusyDialog.close();
                        return;
                    } else {
                        sODataPath = this._oControl.mBindingInfos.suggestionRows.path;
                    }
                    break;
                case "sap.m.ComboBox":
                    sInputBindingPath = this._oControl.mBindingInfos.selectedKey.parts[0].path;
                    sODataPath = this._oControl.mBindingInfos.items.path;
                    sValue = this._oControl.getSelectedKey();
                    if (sInputBindingPath === 'Reason') {
                        if (!sValue) {
                            sValue = this._oControl.getValue();
                        } else if (sValue !== '11') {
                            this.getModel("local").setProperty(this._oControl.getParent().oBindingContexts.local.sPath + "/Remark", "");
                        }
                    } else {
                        // Plant and Type
                        if (sValue) {
                            this._oControl.setEditable(false);
                        } else {
                            sValue = this._oControl.getValue();
                            this._oControl.setEditable(true);
                        }
                    }
                    break;
                default:
                    break;
            }
            this._oControl.setValueState("Error");

            if (sInputBindingPath === "/headSet/Customer") {
                this.getModel("local").setProperty("/headSet/Receiver", "");
            }

            var aFilters = [];
            var sPlant = this.getModel("local").getProperty("/headSet/Plant");
            // if (sODataPath === "/ZC_ManufacturingOrderProductVH") {
            //     oContextBinding = this.getModel().bindContext(sODataPath + "(ManufacturingOrder='" + sValue.split('/')[0] + "',Item='" + sValue.split('/')[1] + "',ProductionPlant='" + sPlant + "')");
            // } else if (sODataPath === "/I_StorageLocationStdVH") {
            //     oContextBinding = this.getModel().bindContext(sODataPath + "(Plant='" + sPlant + "',StorageLocation='" + sValue + "')");
            // } else if (sODataPath === "/ZC_ApplicationReceiverVH" || sODataPath === "/ZC_ProductVH") {
            //     if (sODataPath === "/ZC_ApplicationReceiverVH") {
            //         aFilters.push(new Filter({
            //             path: "Receiver",
            //             operator: FilterOperator.EQ,
            //             value1: sValue
            //         }));
            //     }
            //     if (sODataPath === "/ZC_ProductVH") {
            //         aFilters.push(new Filter({
            //             path: "Material",
            //             operator: FilterOperator.EQ,
            //             value1: sValue
            //         }));
            //     }
            //     oContextBinding = this.getModel().bindList(sODataPath, undefined, undefined, aFilters, {});
            // } else {
            //     oContextBinding = this.getModel().bindContext(sODataPath + "('" + sValue + "')");
            // }
            switch (sODataPath) {
                // Query
                case "/ZC_CostCenterVH":
                    aFilters.push(new Filter({
                        path: "CostCenter",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    }));
                    aFilters.push(new Filter({
                        path: "CompanyCode",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    break;
                case "/ZC_CustomerCompanyVH":
                    aFilters.push(new Filter({
                        path: "Customer",
                        operator: FilterOperator.EQ,
                        value1: _myFunction._isNumeric(sValue) ? sValue.padStart(10, '0') : sValue
                    }));
                    aFilters.push(new Filter({
                        path: "CompanyCode",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    break;
                case "/ZC_ApplicationReceiverVH":
                    aFilters.push(new Filter({
                        path: "Receiver",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    }));
                    break;
                case "/ZC_ManufacturingOrderProductVH":
                    aFilters.push(new Filter({
                        path: "ProductionPlant",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    aFilters.push(new Filter({
                        path: "ManufacturingOrder",
                        operator: FilterOperator.EQ,
                        value1: sValue.split('/')[0].padStart(10, '0')
                    }));
                    aFilters.push(new Filter({
                        path: "Item",
                        operator: FilterOperator.EQ,
                        value1: sValue.split('/')[1]
                    }));
                    break;
                case "/ZC_ProductVH":
                    aFilters.push(new Filter({
                        path: "Plant",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    aFilters.push(new Filter({
                        path: "Material",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    }));
                    break;
                case "/I_StorageLocationStdVH":
                    aFilters.push(new Filter({
                        path: "Plant",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    aFilters.push(new Filter({
                        path: "StorageLocation",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    }));
                    break;
                case "/ZC_TBC1001":
                    aFilters.push(new Filter({
                        path: "ZID",
                        operator: FilterOperator.EQ,
                        value1: "ZPP011"
                    }));
                    aFilters.push(new Filter({
                        path: "Zvalue1",
                        operator: FilterOperator.EQ,
                        value1: sValue
                    }));
                    break;
                default:
                    oContextBinding = this.getModel().bindContext(sODataPath + "('" + sValue + "')");
                    break;
            }
            if (oContextBinding === undefined) {
                oContextBinding = this.getModel().bindList(sODataPath, undefined, undefined, aFilters, {});
            }

            if (sInputBindingPath.includes("/")) {
                // head bind
                if (sInputBindingPath.split("/")[2] === "Type") {
                    aFieldName.push("Zvalue2");
                } else {
                    aFieldName.push(sInputBindingPath.split("/")[2] + "Name");
                }
                aFieldName.forEach(field => {
                    this.getModel("local").setProperty("/headSet/" + field, "");
                });
                if (sODataPath === "/ZC_CostCenterVH" || sODataPath === "/ZC_CustomerCompanyVH" ||
                    sODataPath === "/ZC_ApplicationReceiverVH") {
                    oContextBinding.requestContexts().then(function (aContext) {
                        _myBusyDialog.close();
                        for (const boundContext of aContext) {
                            var object = boundContext.getObject();
                            aFieldName.forEach(field => {
                                this.getModel("local").setProperty("/headSet/" + field, object[field]);
                            });
                            if (sODataPath === "/ZC_CostCenterVH" && object["CostCenter"] === sValue) {
                                this._oControl.setValueState("None");
                            }
                            if (sODataPath === "/ZC_CustomerCompanyVH" && object["Customer"] === sValue) {
                                this._oControl.setValueState("None");
                            }
                            if (sODataPath === "/ZC_ApplicationReceiverVH" && object["Receiver"] === sValue) {
                                this._oControl.setValueState("None");
                            }
                        }
                    }.bind(this), function (oError) {
                        _myBusyDialog.close();
                    }.bind(this));
                } else {
                    oContextBinding.requestObject().then(function (context) {
                        _myBusyDialog.close();
                        this._oControl.setValueState("None");
                        aFieldName.forEach(field => {
                            this.getModel("local").setProperty("/headSet/" + field, context[field]);
                        });
                    }.bind(this), function (oError) {
                        _myBusyDialog.close();
                    }.bind(this));
                }
            } else {
                // table item bind
                var sBindFieldName = sInputBindingPath;
                var sItemPath = this._oControl.getParent().oBindingContexts.local.sPath + "/";
                sInputBindingPath = sItemPath + sBindFieldName;
                if (sBindFieldName === "ManufacturingOrder") {
                    aFieldName.push("Product");
                    aFieldName.push("Material");
                    aFieldName.push("MaterialDescription");
                    aFieldName.push("StorageLocation");
                    aFieldName.push("BaseUnit");
                    aFieldName.push("StandardPrice");
                    aFieldName.push("OrderIsClosed");
                } else if (sBindFieldName === "Material") {
                    aFieldName.push("MaterialDescription");
                    aFieldName.push("BaseUnit");
                    aFieldName.push("StandardPrice");
                    aFieldName.push("TotalAmount");
                } else if (sBindFieldName === "StorageLocation") {
                    aFieldName.push("StorageLocationName");
                }
                aFieldName.forEach(field => {
                    this.getModel("local").setProperty(sItemPath + field, "");
                    if (field === "TotalAmount") {
                        this.getModel("local").setProperty(sItemPath + field, 0);
                    }
                });
                oContextBinding.requestContexts().then(function (aContext) {
                    _myBusyDialog.close();
                    if (aContext.length > 0) {
                        this._oControl.setValueState("None");
                        if (sBindFieldName === "Reason") {
                            return;
                        }
                        for (const boundContext of aContext) {
                            var object = boundContext.getObject();
                            for (const key in object) {
                                if (!key.includes("@odata")) {
                                    this.getModel("local").setProperty(sItemPath + key, object[key]);
                                }
                            }
                            // Calculate amount
                            if (sBindFieldName === "ManufacturingOrder" || sBindFieldName === "Material") {
                                var sValue = this.getModel("local").getProperty(sItemPath + "Quantity");
                                if (sValue && object["StandardPrice"]) {
                                    var iAmount = parseFloat(sValue) * parseFloat(object["StandardPrice"]);
                                    this.getModel("local").setProperty(sItemPath + "TotalAmount", iAmount);
                                    var aConfig = this.getModel("local").getProperty("/Config");
                                    var config = aConfig.find(element => element.Plant === sPlant);
                                    if (iAmount >= parseFloat(config.Amount)) {
                                        this.getModel("local").setProperty(sItemPath + "DeleteFlag", "W");
                                        // this.getModel("local").setProperty(sItemPath + "Status", "Error");
                                        $("#" + this._oControl.getParent().getId()).css("background-color", "#f2bfc0");
                                        $("#" + this._oControl.getParent().getId() + "-fixed").css("background-color", "#f2bfc0");
                                    } else {
                                        // this.getModel("local").setProperty(sItemPath + "Status", "None");
                                        $("#" + this._oControl.getParent().getId()).css("background-color", "#fff");
                                        $("#" + this._oControl.getParent().getId() + "-fixed").css("background-color", "#fff");
                                    }
                                }
                            }
                        }
                    }
                }.bind(this), function (oError) {
                    _myBusyDialog.close();
                }.bind(this));
            }
            if (!sValue) {
                this._oControl.setValueState("None");
            }
        },

        handleSuggest: function (oEvent) {
            var aFilters = [];
            var sPlant = this.getModel("local").getProperty("/headSet/Plant");
            if (sPlant) {
                aFilters.push(new Filter("CompanyCode", FilterOperator.EQ, sPlant));
            }
            oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
        },

        handleCalculate: function (oEvent) {
            var oRow = oEvent.getSource().getParent();
            var sPath = oRow.oBindingContexts.local.sPath;
            var sValue = oEvent.getParameter("value");
            var sPlant = this.getModel("local").getProperty("/headSet/Plant");
            var aConfig = this.getModel("local").getProperty("/Config");
            var config = aConfig.find(element => element.Plant === sPlant);
            var sStandardPrice = this.getModel("local").getProperty(sPath + "/StandardPrice");
            // this.getModel("local").setProperty(sPath + "/Status", "None");
            this.getModel("local").setProperty(sPath + "/TotalAmount", 0);
            this.getModel("local").setProperty(sPath + "/DeleteFlag", "");
            $("#" + oRow.getId()).css("background-color", "#fff");
            $("#" + oRow.getId() + "-fixed").css("background-color", "#fff");
            if (sValue && parseFloat(sValue) !== 0) {
                oEvent.getSource().setValueState("None");
                if (sStandardPrice) {
                    var iAmount = parseFloat(sValue) * parseFloat(sStandardPrice);
                    var sDeleteFlag = iAmount >= parseFloat(config.Amount) ? "W" : "";
                    this.getModel("local").setProperty(sPath + "/TotalAmount", iAmount);
                    this.getModel("local").setProperty(sPath + "/DeleteFlag", sDeleteFlag);
                    if (sDeleteFlag === "W") {
                        // this.getModel("local").setProperty(sPath + "/Status", "Error");
                        $("#" + oRow.getId()).css("background-color", "#f2bfc0");
                        $("#" + oRow.getId() + "-fixed").css("background-color", "#f2bfc0");
                    }
                }
            } else {
                oEvent.getSource().setValueState("Error");
            }
        },

        onDelete: function () {
            var that = this;
            _myFunction._processRequest("DELETE", that);
        },

        onResent: function () {
            var that = this;
            _myFunction._processRequest("RESENT", that);
        },

        onPrint: function () {
            var that = this;
            _myFunction._processRequest("PRINT", that);
        },

        onApproval: function () {
            var that = this;
            _myFunction._processRequest("APPROVAL", that);
        },

        onCancelApproval: function () {
            var that = this;
            _myFunction._processRequest("CANCELAPPROVAL", that);
        },

        onPosting: function () {
            var that = this;
            _myFunction._processRequest("POSTING", that);
        },

        onCancelPosting: function () {
            var that = this;
            _myFunction._processRequest("CANCELPOSTING", that);
        },

        _processRequest: function (bEvent, that) {
            var sTitle, items = [];
            var aContexts = that._controller.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                // "/MaterialRequisition(MaterialRequisitionNo='TEST20240821000',ItemNo='20')"
                let aSplitArray = element.getPath().split("'");
                items.push({
                    MaterialRequisitionNo: aSplitArray[1],
                    ItemNo: aSplitArray[3]
                });
            });
            var oRequestData = {
                items: items,
                user: _UserInfo.getEmail() === undefined ? "" : _UserInfo.getEmail(),
                username: _UserInfo.getFullName() === undefined ? "" : _UserInfo.getFullName(),
                datetime: _myFunction._getCurrentDateTime()
            }
            switch (bEvent) {
                case "DELETE":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Delete");
                    break;
                case "RESENT":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Resent");
                    break;
                case "PRINT":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Print");
                    break;
                case "APPROVAL":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Approval");
                    break;
                case "CANCELAPPROVAL":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("CancelApproval");
                    break;
                case "POSTING":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Posting");
                    break;
                case "CANCELPOSTING":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("CancelPosting");
                    break;
                default:
                    break;
            }
            MessageBox.confirm(that.getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        _myFunction._callOData(bEvent, oRequestData, that);
                    }
                },
                dependentOn: that.routing.getView()
            });
        },

        _callOData: function (bEvent, oRequestData, that) {
            var aPromise = [];
            if (bEvent === "POSTING" || bEvent === "CANCELPOSTING") {
                var items = _myFunction._removeDuplicates(oRequestData.items, ["MaterialRequisitionNo"]);
                items.forEach(item => {
                    aPromise.push(_myFunction._callODataAction(bEvent, {
                        header: { MaterialRequisitionNo: item.MaterialRequisitionNo },
                        user: oRequestData.user,
                        username: oRequestData.username,
                        datetime: oRequestData.datetime
                    }, that));
                });
            } else {
                aPromise.push(_myFunction._callODataAction(bEvent, oRequestData, that));
            }
            try {
                _myBusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    _myBusyDialog.close();
                    var aMessageItems = [];
                    var aPrintRecords = [];
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var result = JSON.parse(object.Zzkey);
                        if (bEvent === "QUERY" && result.MESSAGEITEMS.length === 0) {
                            that.getModel("local").setProperty("/headSet", {
                                Plant: result.HEADER.PLANT,
                                Type: result.HEADER.TYPE,
                                MaterialRequisitionNo: result.HEADER.MATERIAL_REQUISITION_NO,
                                HeaderCreatedDate: new Date(result.HEADER.CREATED_DATE),
                                CostCenter: result.HEADER.COST_CENTER,
                                CostCenterName: result.HEADER.COST_CENTER_NAME,
                                Customer: result.HEADER.CUSTOMER,
                                CustomerName: result.HEADER.CUSTOMER_NAME,
                                Receiver: result.HEADER.RECEIVER,
                                RequisitionDate: new Date(result.HEADER.REQUISITION_DATE),
                                LineWarehouseStatus: result.HEADER.LINE_WAREHOUSE_STATUS === "X" ? true : false,
                                LocalLastChangedAtS: result.HEADER.LOCAL_LAST_CHANGED_AT_S,
                            });
                            var items = [];
                            result.ITEMS.forEach(element => {
                                var iAmount = parseFloat(element.STANDARD_PRICE) * parseFloat(element.QUANTITY);
                                items.push({
                                    ItemNo: element.ITEM_NO,
                                    ManufacturingOrder: element.MANUFACTURING_ORDER,
                                    Product: element.PRODUCT,
                                    Material: element.MATERIAL,
                                    MaterialDescription: element.MATERIAL_DESCRIPTION,
                                    Quantity: element.QUANTITY,
                                    BaseUnit: element.BASE_UNIT,
                                    StorageLocation: element.STORAGE_LOCATION,
                                    StorageLocationName: element.STORAGE_LOCATION_NAME,
                                    Location: element.LOCATION,
                                    Remark: element.REMARK,
                                    StandardPrice: element.STANDARD_PRICE,
                                    TotalAmount: iAmount,
                                    Currency: element.CURRENCY,
                                    OrderIsClosed: element.ORDER_IS_CLOSED,
                                    LocalLastChangedAtS: element.LOCAL_LAST_CHANGED_AT_S,
                                    DeleteFlag: element.DELETE_FLAG, //iAmount >= 100000 ? "W" : ""
                                    Status: element.DELETE_FLAG === "W" ? "Error" : "None"
                                });
                            });
                            that.getModel("local").setProperty("/itemSet", items);
                            sap.ui.getCore().byId("idMaterialRequisitionNo").setEditable(false);
                            sap.ui.getCore().byId("idSaveBtn").setVisible(true);
                        } else if (bEvent === "QUERY") {
                            // has error message
                            sap.ui.getCore().byId("idSaveBtn").setVisible(false);
                        } else if (bEvent === "SAVE") {
                            that.getModel("local").setProperty("/headSet/MaterialRequisitionNo", result.HEADER.MATERIAL_REQUISITION_NO);
                        } else if (bEvent === "PRINT") {
                            result.ITEMS.forEach(element => {
                                if (element.RECORDUUID) {
                                    aPrintRecords.push({ RecordUUID: element.RECORDUUID });
                                }
                            });
                            aPrintRecords = _myFunction._removeDuplicates(aPrintRecords, ["RecordUUID"]);
                        }
                        result.MESSAGEITEMS.forEach(element => {
                            aMessageItems.push({
                                type: element.TYPE,
                                title: element.TITLE,
                                description: element.DESCRIPTION,
                                subtitle: element.SUBTITLE
                            });
                        });
                    }
                    that.getModel("local").setProperty("/MessageItems", aMessageItems);
                    _myMessageView.setModel(that.getModel("local"));
                    // bEvent = "PRINT"
                    aPrintRecords.forEach(element => {
                        // 'PrintRecord(RecordUUID=2d218e58-501b-1eef-99b5-8604583014eb,IsActiveEntity=true)'
                        var sPath = "PrintRecord(RecordUUID=" + element.RecordUUID + ",IsActiveEntity=true)";
                        var sURL = that.getModel("Print").getServiceUrl() + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);
                    });
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    _myBusyDialog.close();
                    var aMessageItems = that.getModel("local").getProperty("/MessageItems");
                    if (aMessageItems.length > 0) {
                        _myMessageView.navigateBack();
                        that.routing.getView().addDependent(_myMessageDialog);
                        _myMessageDialog.open();
                    }
                    if (bEvent !== "SAVE" && bEvent !== "QUERY") {
                        // refresh
                        that.getModel().refresh();
                    }
                });
            } catch (error) {
                MessageBox.error(error);
                _myBusyDialog.close();
            }
        },

        _callODataAction: function (bEvent, aRequestData, that) {
            return new Promise((resolve, reject) => {
                var processLogic = that.getModel().bindContext("/MaterialRequisition/com.sap.gateway.srvd.zui_materialrequisition_o4.v0001.processLogic(...)");
                processLogic.setParameter("Event", bEvent);
                processLogic.setParameter("Zzkey", JSON.stringify(aRequestData));
                processLogic.setParameter("RecordUUID", "");
                processLogic.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(processLogic);
                }).catch((error) => {
                    reject(error);
                });
            });
        },

        _requiredFields: function (oTable, that) {
            var bFlag = false;
            var aIdListOfRequiredFields = [
                "idPlant",
                "idType",
                "idCostCenter",
                "idCustomer",
                "idReceiver",
                "idRequisitionDate"
            ];
            oTable.getRows().forEach(oRow => {
                if (oRow.oBindingContexts.local) {
                    var oCells = oRow.getCells();
                    oCells.forEach(cell => {
                        if (cell.sId.includes("input")) {
                            aIdListOfRequiredFields.push(cell.sId);
                        }
                    });
                }
            });
            aIdListOfRequiredFields.forEach(sId => {
                var sValue = "";
                var oControl = sap.ui.getCore().byId(sId);
                var sValueState = oControl.getValueState();
                if (oControl.getRequired()) {
                    switch (oControl.getMetadata().getName()) {
                        case "sap.m.Input":
                            sValue = oControl.getValue();
                            break;
                        case "sap.m.DatePicker":
                            sValue = oControl.getDateValue();
                            break;
                        case "sap.m.ComboBox":
                            sValue = oControl.getSelectedKey();
                            break;
                        default:
                            break;
                    }
                    if (sValue && sValueState === "Error") {
                        bFlag = true;
                    } else if (sValue) {
                        // oControl.setValueState("None");
                    } else {
                        if (oControl.mBindingInfos.value) {
                            if (oControl.mBindingInfos.value.parts[0].path === "Remark") {
                                var sPath = oControl.getParent().oBindingContexts.local.sPath;
                                var sReason = that.getModel("local").getProperty(sPath + "/Reason");
                                if (sReason === "11" && !sValue) {
                                    bFlag = true;
                                    oControl.setValueState("Error");
                                }
                            } else {
                                bFlag = true;
                                oControl.setValueState("Error");
                            }
                        } else {
                            bFlag = true;
                            oControl.setValueState("Error");
                        }
                    }
                } else {
                    oControl.setValueState("None");
                }
            });
            return bFlag;
        },

        _removeDuplicates: function (arr, keys) {
            return arr.reduce((result, obj) => {
                const index = result.findIndex(item => {
                    return keys.every(key => item[key] === obj[key]);
                });
                if (index !== -1) {
                    result[index] = obj;
                } else {
                    result.push(obj);
                }
                return result;
            }, []);
        },

        _getCurrentDateTime: function () {
            var date = new Date();
            var sTime = date.getUTCFullYear().toString() +
                _myFunction._pad2(date.getUTCMonth() + 1) +
                _myFunction._pad2(date.getUTCDate()) +
                _myFunction._pad2(date.getUTCHours()) +
                _myFunction._pad2(date.getUTCMinutes()) +
                _myFunction._pad2(date.getUTCSeconds());
            return sTime;
        },
        _pad2: function (n) {
            return parseInt(n) < 10 ? "0" + parseInt(n) : n;
        },

        _isNumeric: function (str) {
            return /^[0-9]+$/.test(str);
        }
    };
});
