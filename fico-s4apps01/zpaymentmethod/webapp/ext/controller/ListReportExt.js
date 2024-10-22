sap.ui.define([
    "../controller/ValueHelpDialog",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (ValueHelpDialog, formatter, BusyDialog, MessageBox, Fragment) {
    'use strict';

    var _myFunction, _myBusyDialog, _myMessageView, _myMessageDialog;
    return {
        ValueHelpDialog: ValueHelpDialog,
        formatter: formatter,

        init: function () {
            
            _myFunction = sap.ui.require("fico/zpaymentmethod/ext/controller/ListReportExt");
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
            MessageBox.information(this.getModel("i18n").getResourceBundle().getText("selectOperation"), {
                actions: ["{i18n>Create}", "{i18n>Update}", MessageBox.Action.CLOSE],
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.CLOSE) {
                        return;
                    }
                    if (sAction === "{i18n>Create}") {
                        that.getModel("local").setProperty("/mode", "create");
                    } else {
                        that.getModel("local").setProperty("/mode", "update");
                    }
                    _myBusyDialog.open();
                    Fragment.load({
                        name: "fico.zpaymentmethod.ext.fragments.Operation",
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
                },
                dependentOn: this.routing.getView()
            });
        },

        onSearch: function () {
            var oControl1 = sap.ui.getCore();
            console.log("11coreplant"+oControl1);
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
            items.forEach(item => {
                var iAmount = parseFloat(item.StandardPrice) * parseFloat(item.Quantity);
                item.DeleteFlag = iAmount >= 100000 ? "W" : "";
            });
            var oRequestData = {
                header: header,
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: _myFunction._getCurrentDateTime()
            }
            if (!_myFunction._requiredFields(oTable)) {
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
                DeleteFlag: ""
            };
            items.push(item);
            items.forEach((line, index) => {
                line.ItemNo = (index + 1) * 10;
            });
            this.getModel("local").setProperty("/itemSet", items);
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

            console.log("handleChange");
            console.log(this.getModel("local"));
            var aFieldName = [];
            var sValue, sInputBindingPath, sODataPath, oContextBinding;
            this._oControl = oEvent.getSource();
            console.log(this._oControl.getMetadata().getName());
            switch (this._oControl.getMetadata().getName()) {
                case "sap.m.Input":
                    sValue = this._oControl.getValue();
                    sInputBindingPath = this._oControl.mBindingInfos.value.parts[0].path;
                    sODataPath = this._oControl.mBindingInfos.suggestionRows.path;
                    break;
                case "sap.m.ComboBox":
                    sValue = this._oControl.getSelectedKey();
                    //sValue = this._oControl.getValue();
                    sInputBindingPath = this._oControl.mBindingInfos.selectedKey.parts[0].path;
                    sODataPath = this._oControl.mBindingInfos.items.path;
                    break;
                default:
                    break;
            }
            const selID = oEvent.getSource().getValue();
            const selID1 = oEvent.getSource().getSelectedKey();
            //console.log("getValue" +  selID);
            //console.log("getSelectedKey" +  selID1);
            //console.log(this._oControl);
            //console.log(sInputBindingPath);
            //console.log(sODataPath);
            this._oControl.setValueState("Error");
            if (sODataPath === "/ZC_ManufacturingOrderProductVH") {
                oContextBinding = this.getModel().bindContext(sODataPath + "(ManufacturingOrder='" + sValue.split('/')[0] + "',Item='" + sValue.split('/')[1] + "')");
            } else if (sODataPath === "/I_StorageLocationStdVH") {
                var sPlant = this.getModel("local").getProperty("/headSet/Plant");
                oContextBinding = this.getModel().bindContext(sODataPath + "(Plant='" + sPlant + "',StorageLocation='" + sValue + "')");
            } else {
                oContextBinding = this.getModel().bindContext(sODataPath + "('" + sValue + "')");
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
                oContextBinding.requestObject().then(function (context) {
                    this._oControl.setValueState("None");
                    aFieldName.forEach(field => {
                        this.getModel("local").setProperty("/headSet/" + field, context[field]);
                    });
                }.bind(this));
            } else {
                // table item bind
                var sBindFieldName = sInputBindingPath;
                var sItemPath = this._oControl.getParent().oBindingContexts.local.sPath + "/";
                sInputBindingPath = sItemPath + sBindFieldName;
                if (sBindFieldName === "ManufacturingOrder") {
                    aFieldName.push("Product");
                    aFieldName.push("Material");
                    aFieldName.push("MaterialDescription");
                    aFieldName.push("BaseUnit");
                    aFieldName.push("StandardPrice");
                    aFieldName.push("OrderIsClosed");
                } else if (sBindFieldName === "Material") {
                    aFieldName.push("MaterialDescription");
                    aFieldName.push("BaseUnit");
                    aFieldName.push("StandardPrice");
                    aFieldName.push("TotalAmount");
                } else {
                    aFieldName.push("StorageLocationName");
                }
                aFieldName.forEach(field => {
                    this.getModel("local").setProperty(sItemPath + field, "");
                    if (field === "TotalAmount") {
                        this.getModel("local").setProperty(sItemPath + field, 0);
                    }
                });
                oContextBinding.requestObject().then(function (context) {
                    this._oControl.setValueState("None");
                    for (const key in context) {
                        if (!key.includes("@odata")) {
                            this.getModel("local").setProperty(sItemPath + key, context[key]);
                        }
                    }
                    if (sBindFieldName === "ManufacturingOrder" || sBindFieldName === "Material") {
                        // Calculate amount
                        var sValue = this.getModel("local").getProperty(sItemPath + "Quantity");
                        if (sValue && context["StandardPrice"]) {
                            var iAmount = parseFloat(sValue) * parseFloat(context["StandardPrice"]);
                            this.getModel("local").setProperty(sItemPath + "TotalAmount", iAmount);
                            if (iAmount >= 100000) {
                                this.getModel("local").setProperty(sItemPath + "DeleteFlag", "W");
                            }
                        }
                    }
                }.bind(this));
            }
            if (!sValue) {
                this._oControl.setValueState("None");
            }
            console.log("sValue"+sValue);
        },

        handleCalculate: function (oEvent) {
            var sPath = oEvent.getSource().getParent().oBindingContexts.local.sPath;
            var sValue = oEvent.getParameter("value");
            var sStandardPrice = this.getModel("local").getProperty(sPath + "/StandardPrice");
            if (sValue && parseFloat(sValue) !== 0) {
                oEvent.getSource().setValueState("None");
                if (sStandardPrice) {
                    var iAmount = parseFloat(sValue) * parseFloat(sStandardPrice);
                    this.getModel("local").setProperty(sPath + "/TotalAmount", iAmount);
                } else {
                    this.getModel("local").setProperty(sPath + "/TotalAmount", 0);
                }
            } else {
                oEvent.getSource().setValueState("Error");
                this.getModel("local").setProperty(sPath + "/TotalAmount", 0);
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
                user: "P00001",
                username: "Xinlei Xu",
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
            if (bEvent === "POSTING" || bEvent === "POSTING") {
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
                                    DeleteFlag: iAmount >= 100000 ? "W" : ""
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
                                aPrintRecords.push({ RecordUUID: element.RECORDUUID });
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

        _requiredFields: function (oTable) {
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
                        bFlag = true;
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
