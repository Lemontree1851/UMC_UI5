sap.ui.define([
    "../controller/ValueHelpDialog",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (ValueHelpDialog, formatter, BusyDialog, MessageBox, MessageToast, Fragment) {
    'use strict';

    var _myFunction, _myBusyDialog, _myMessageView, _myMessageDialog;
    return {
        ValueHelpDialog: ValueHelpDialog,
        formatter: formatter,

        init: function () {
            _myFunction = sap.ui.require("pp/zmaterialrequisition/ext/controller/ListReportExt");
            _myBusyDialog = new BusyDialog();
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
                    text: "{i18n>closeBtn}"
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

        openCreateDialog: function () {
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
                ManufacturingOrder: "",
                Product: "",
                OrderIsClosed: "",
                LineWarehouseStatus: false
            });
            this.getModel("local").setProperty("/itemSet", []);
            _myBusyDialog.open();
            Fragment.load({
                name: "pp.zmaterialrequisition.ext.fragments.Create",
                controller: this
            }).then(function (oDialog) {
                //ダイアログがロードされたら
                this._oCreateDialog = oDialog;
                //ダイアログからモデルを使用できるようにする
                this._view.addDependent(this._oCreateDialog);
                this._oCreateDialog.addButton(new sap.m.Button({
                    text: "{i18n>closeBtn}",
                    press: function () {
                        that.getModel("local").setProperty("/headSet", {});
                        that.getModel("local").setProperty("/itemSet", []);
                        that._oCreateDialog.destroy();
                    }
                }));
                _myBusyDialog.close();
                this._oCreateDialog.open();
            }.bind(this));
        },

        onSave: function (oEvent) {
            var that = this;
            var header = this.getModel("local").getProperty("/headSet");
            var items = this.getModel("local").getProperty("/itemSet");
            var oRequestData = {
                header: header,
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: _myFunction._getCurrentDateTime(),
            }
            if (_myFunction._requiredFields()) {
                _myFunction._callOData("SAVE", oRequestData, that);
            }
        },

        onAddLine: function () {
            var sProduct = this.getModel("local").getProperty("/headSet/Product");
            var items = this.getModel("local").getProperty("/itemSet");
            if (sProduct) {
                var oContextBinding = this.getModel().bindContext("/ZC_ProductVH" + "('" + sProduct.replace(/\s/g, "") + "')");
                oContextBinding.requestObject().then(function (context) {
                    var item = {
                        ItemNo: 0,
                        Material: context.Product,
                        MaterialDescription: context.ProductDescription,
                        Quantity: "",
                        BaseUnit: context.BaseUnit,
                        StorageLocation: "",
                        StorageLocationName: "",
                        Remark: "",
                        StandardPrice: context.StandardPrice,
                        TotalAmount: 0,
                        Currency: context.Currency
                    };
                    items.push(item);
                    items.forEach((line, index) => {
                        line.ItemNo = (index + 1) * 10;
                    });
                    this.getModel("local").setProperty("/itemSet", items);
                }.bind(this));
            } else {
                var item = {
                    ItemNo: 0,
                    Material: "",
                    MaterialDescription: "",
                    Quantity: "",
                    BaseUnit: "",
                    StorageLocation: "",
                    StorageLocationName: "",
                    Remark: "",
                    StandardPrice: "",
                    TotalAmount: 0,
                    Currency: ""
                };
                items.push(item);
                items.forEach((line, index) => {
                    line.ItemNo = (index + 1) * 10;
                });
                this.getModel("local").setProperty("/itemSet", items);
            }
        },

        onDelLine: function (oEvent) {
            var aSelectedIndices = oEvent.getSource().getParent().getParent().getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                return;
            }
            var items = this.getModel("local").getProperty("/itemSet");
            var iLen = aSelectedIndices.length - 1;
            do {
                items.splice(aSelectedIndices[iLen], 1);
                iLen--;
            } while (iLen >= 0);
            items.forEach((line, index) => {
                line.ItemNo = (index + 1) * 10;
            });
            this.getModel("local").setProperty("/itemSet", items);
        },

        handleChange: function (oEvent) {
            var sValue, sInputBindingPath, sODataPath, sFieldName;
            this._oControl = oEvent.getSource();
            switch (this._oControl.getMetadata().getName()) {
                case "sap.m.Input":
                    sValue = this._oControl.getValue();
                    sInputBindingPath = this._oControl.mBindingInfos.value.parts[0].path;
                    sODataPath = this._oControl.mBindingInfos.suggestionRows.path;
                    break;
                case "sap.m.ComboBox":
                    sValue = this._oControl.getSelectedKey();
                    sInputBindingPath = this._oControl.mBindingInfos.selectedKey.parts[0].path;
                    sODataPath = this._oControl.mBindingInfos.items.path;
                    break;
                default:
                    break;
            }
            var oContextBinding = this.getModel().bindContext(sODataPath + "('" + sValue + "')");
            var aFieldName = [];
            if (sInputBindingPath.split("/")[2] === "ManufacturingOrder") {
                aFieldName.push("Product");
                aFieldName.push("OrderIsClosed");
            } else if (sInputBindingPath.split("/")[2] === "Type") {
                aFieldName.push("Zvalue2");
            } else {
                aFieldName.push(sInputBindingPath.split("/")[2] + "Name");
            }
            this._oControl.setValueState("Error");
            aFieldName.forEach(field => {
                this.getModel("local").setProperty("/headSet/" + field, "");
            });
            oContextBinding.requestObject().then(function (context) {
                this._oControl.setValueState("None");
                aFieldName.forEach(field => {
                    this.getModel("local").setProperty("/headSet/" + field, context[field]);
                });
            }.bind(this));
        },

        handleCalculate: function (oEvent) {
            var sPath = oEvent.getSource().getParent().oBindingContexts.local.sPath;
            var sValue = oEvent.getParameter("value");
            var sStandardPrice = this.getModel("local").getProperty(sPath + "/StandardPrice");
            if (sValue && sStandardPrice) {
                var iAmount = parseFloat(sValue) * parseFloat(sStandardPrice);
                this.getModel("local").setProperty(sPath + "/TotalAmount", iAmount);
            }
        },

        _callOData: function (bEvent, oRequestData, that) {
            var aPromise = [];
            aPromise.push(_myFunction._callODataAction(bEvent, oRequestData, that));
            try {
                _myBusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    _myBusyDialog.close();
                    var aMessageItems = [];
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var result = JSON.parse(object.Zzkey);
                        debugger;
                        if (bEvent === 'SAVE') {
                            that.getModel("local").setProperty("/headSet/MaterialRequisitionNo", result.HEADER.MATERIAL_REQUISITION_NO);
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
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    _myBusyDialog.close();
                    var aMessageItems = that.getModel("local").getProperty("/MessageItems");
                    if (aMessageItems.length > 0) {
                        _myMessageView.navigateBack();
                        that._view.addDependent(_myMessageDialog);
                        _myMessageDialog.open();
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

        _requiredFields: function () {
            var bFlag = false;
            var aIdListOfRequiredFields = [
                "idPlant",
                "idType",
                "idCostCenter",
                "idCustomer",
                "idReceiver",
                "idRequisitionDate",
                "idManufacturingOrder"
            ];
            aIdListOfRequiredFields.forEach(sId => {
                var sValue = "";
                var oControl = sap.ui.getCore().byId(sId);
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
                    if (sValue) {
                        oControl.setValueState("None");
                    } else {
                        // bFlag = true;
                        oControl.setValueState("Error");
                    }
                };
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
            return n < 10 ? "0" + n : n;
        }
    };
});
