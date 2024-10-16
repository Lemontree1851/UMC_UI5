sap.ui.define([
    "sap/m/MessageToast"
], function(MessageToast) {
    'use strict';

    var _myFunction;
    return {
        init: function () {
            _myFunction = sap.ui.require("pp/zproductionorderrelease/ext/controller/ListReportExt.controller");
        },

        onRelease: function () {
            var that = this;
            _myFunction._processRequest("RELEASE", that);
        },
        
        _processRequest: function (bEvent, that) {
            var sTitle, items = [];
            var aContexts = that._controller.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                // "/MaterialRequisition(MaterialRequisitionNo='TEST20240821000',ItemNo='20')"
                let aSplitArray = element.getPath().split("'");
                items.push({
                    Plant: aSplitArray[1],
                    ManufacturingOrder: aSplitArray[3]
                });
            });
            var oRequestData = {
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: _myFunction._getCurrentDateTime()
            }
            switch (bEvent) {
                case "RELEASE":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Release");
                    break;
                default:
                    break;
            }

            _myFunction._callOData(bEvent, oRequestData, that);

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
            aPromise.push(_myFunction._callODataAction(bEvent, oRequestData, that));
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
        }
    };
        //onRelease: function(oEvent) {
        //    MessageToast.show("Custom handler invoked.");
        //}
});