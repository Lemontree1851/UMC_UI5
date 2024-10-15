sap.ui.define([
    "./Base",
    "./ValueHelpDialog",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (Base, ValueHelpDialog, formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment) {
    "use strict";

    return Base.extend("pp.zpickinglist.controller.Main", {

        ValueHelpDialog: ValueHelpDialog,
        formatter: formatter,

        onInit: function () {
            var that = this;
            this._myBusyDialog = new BusyDialog();
            this._UserInfo = sap.ushell.Container.getService("UserInfo");
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

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                sRequisitionDate,
                aNewFilters = [];
            var sEntitySet = oEvent.getSource().getProperty("entitySet");
            if (sEntitySet === "ZC_PICKINGLIST_STD") {
                sRequisitionDate = this.getModel("local").getProperty("/dateValue");
                aNewFilters.push(new Filter("RequisitionDate", FilterOperator.EQ, sRequisitionDate));
                if (aNewFilters.length) {
                    oNewFilter = new Filter({
                        filters: aNewFilters,
                        and: false
                    });
                    aFilters.push(oNewFilter);
                }
            }
        },

        onSearch: function () {
            this.getModel().resetChanges();
        },

        onPressBtn: function (sEvent) {
            if (sEvent === "STD_EDIT") {
                this.getModel("local").setProperty("/std_mode", "edit");
                return;
            } else if (sEvent === "STD_DISPLAY") {
                this.getModel("local").setProperty("/std_mode", "display");
                return;
            } else if (sEvent === "TAB_EDIT") {
                this.getModel("local").setProperty("/tab_mode", "edit");
                return;
            } else if (sEvent === "TAB_DISPLAY") {
                this.getModel("local").setProperty("/tab_mode", "display");
                return;
            } else {
                var that = this;
                if (sEvent.includes("STD")) {
                    this._oTable = this.byId("idStandardListTable");
                } else if (sEvent.includes("TAB")) {
                    this._oTable = this.byId("idCustomListTable");
                }
                var aSelectedItems = this._oTable.getSelectedIndices();
                var iLen = aSelectedItems.length;
                var sTitle;
                var aItems = [],
                    aDetails = [];
                var aMessageItems = [];
                if (!iLen) {
                    MessageBox.error(this.getResourceBundle().getText("NoneSelected"));
                    return;
                }
                while (iLen--) {
                    var sPath = this._oTable.getContextByIndex(aSelectedItems[iLen]).getPath();
                    var oRow = this.getModel().getObject(sPath);
                    aItems.push(oRow);
                    if (oRow.DetailsJson) {
                        aDetails.push(JSON.parse(oRow.DetailsJson));
                    }
                }
                if (sEvent === "STD_DETAIL" || sEvent === "TAB_DETAIL") {
                    this.getModel("local").setProperty("/detailSet", aDetails.flat());
                    this.showDetailsDialog();
                    return;
                }
                aItems.sort(function (a, b) {
                    return a.RowNo - b.RowNo;
                });
                switch (sEvent) {
                    case "STD_CREATE":
                        sTitle = this.getModel("i18n").getResourceBundle().getText("Create");
                        break;
                    case "TAB_SAVE":
                        sTitle = this.getModel("i18n").getResourceBundle().getText("Save");
                        break;
                    case "TAB_DELETE":
                        sTitle = this.getModel("i18n").getResourceBundle().getText("Delete");
                        break;
                    default:
                        break;
                }
                if (sEvent === "TAB_SAVE" || sEvent === "TAB_DELETE") {
                    var aReservation = this._removeDuplicates(aItems, ["Reservation"]);
                    if (aReservation.length > 1) {
                        // 入出庫予定処理件数は1件しか処理できません。
                        aMessageItems.push({
                            type: "Error",
                            title: this.getModel("i18n").getResourceBundle().getText("Error"),
                            description: this.getModel("i18n").getResourceBundle().getText("Message7"),
                            subtitle: this.getModel("i18n").getResourceBundle().getText("Message7")
                        });
                    }
                }
                if (sEvent === "STD_CREATE" || sEvent === "TAB_SAVE") {
                    for (let index = 0; index < aItems.length; index++) {
                        const element = aItems[index];
                        // 移動数量は在庫数量を超えるかをチェックする
                        if (element.StorageLocationFrom) {
                            if (element.StorageLocationFrom === element.StorageLocationTo) {
                                // 行 {0} の保管場所(From)と(TO)が同じです。チェックしてください。
                                aMessageItems.push({
                                    type: "Error",
                                    title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                    description: this.getModel("i18n").getResourceBundle().getText("Message1", [element.RowNo]),
                                    subtitle: this.getModel("i18n").getResourceBundle().getText("Message1", [element.RowNo])
                                });
                            }
                        } else {
                            // 行 {0} {1}を入力してください。
                            aMessageItems.push({
                                type: "Error",
                                title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                description: this.getModel("i18n").getResourceBundle().getText("Message6", [element.RowNo, this.getModel("i18n").getResourceBundle().getText("StorageLocationFrom")]),
                                subtitle: this.getModel("i18n").getResourceBundle().getText("Message6", [element.RowNo, this.getModel("i18n").getResourceBundle().getText("StorageLocationFrom")])
                            });
                        }

                        if (element.TotalTransferQuantity === '' || parseInt(element.TotalTransferQuantity) === 0) {
                            // 行 {0} {1}を入力してください。
                            aMessageItems.push({
                                type: "Error",
                                title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                description: this.getModel("i18n").getResourceBundle().getText("Message6", [element.RowNo, this.getModel("i18n").getResourceBundle().getText("TotalTransferQuantity")]),
                                subtitle: this.getModel("i18n").getResourceBundle().getText("Message6", [element.RowNo, this.getModel("i18n").getResourceBundle().getText("TotalTransferQuantity")])
                            });
                        } else {
                            // 移動数量は在庫数量を超えるかをチェックする
                            if (parseFloat(element.TotalTransferQuantity) > parseFloat(element.StorageLocationFromStock)) {
                                // 行 {0} の移動数量は在庫数量を超えました。
                                aMessageItems.push({
                                    type: "Error",
                                    title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                    description: this.getModel("i18n").getResourceBundle().getText("Message2", [element.RowNo]),
                                    subtitle: this.getModel("i18n").getResourceBundle().getText("Message2", [element.RowNo])
                                });
                            }
                            // 移動数量は欠品数量を超えるかをチェックする
                            if (parseFloat(element.TotalTransferQuantity) < parseFloat(element.TotalShortFallQuantity)) {
                                // 行 {0} の移動数量は欠品数量より少ないです。
                                aMessageItems.push({
                                    type: "Warning",
                                    title: this.getModel("i18n").getResourceBundle().getText("Warning"),
                                    description: this.getModel("i18n").getResourceBundle().getText("Message4", [element.RowNo]),
                                    subtitle: this.getModel("i18n").getResourceBundle().getText("Message4", [element.RowNo])
                                });
                            } else {
                                if (element.SizeOrDimensionText === "X") {
                                    if (parseFloat(element.TotalTransferQuantity) > parseFloat(element.TotalShortFallQuantity)) {
                                        // 行 {0} の移動数量は欠品数量を超えることはできません。
                                        aMessageItems.push({
                                            type: "Error",
                                            title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                            description: this.getModel("i18n").getResourceBundle().getText("Message3", [element.RowNo]),
                                            subtitle: this.getModel("i18n").getResourceBundle().getText("Message3", [element.RowNo])
                                        });
                                    }
                                } else {
                                    if (parseFloat(element.TotalTransferQuantity) > parseFloat(element.TotalShortFallQuantity)) {
                                        // 行 {0} の移動数量は欠品数量を超えました。
                                        aMessageItems.push({
                                            type: "Warning",
                                            title: this.getModel("i18n").getResourceBundle().getText("Warning"),
                                            description: this.getModel("i18n").getResourceBundle().getText("Message5", [element.RowNo]),
                                            subtitle: this.getModel("i18n").getResourceBundle().getText("Message5", [element.RowNo])
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                var obj = aMessageItems.find(item => item.type === "Error");
                if (obj) {
                    this.showMessageDialog(aMessageItems);
                    return;
                }
                var oRequestData = {
                    items: aItems,
                    user: this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail(),
                    username: this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName(),
                    datetime: this.getCurrentUTCDateTime()
                }
                MessageBox.confirm(this.getModel("i18n").getResourceBundle().getText("ConfirmMessage", [sTitle]), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    emphasizedAction: MessageBox.Action.OK,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._CallODataV2("ACTION", "/processLogic", [], {
                                "Event": sEvent,
                                "Zzkey": JSON.stringify(oRequestData),
                                "RecordUUID": ""
                            }, {}).then(function (oResponse) {
                                var result = JSON.parse(oResponse.processLogic.Zzkey);
                                result.MESSAGEITEMS.forEach(element => {
                                    aMessageItems.push({
                                        type: element.TYPE,
                                        title: element.TITLE,
                                        description: element.DESCRIPTION,
                                        subtitle: element.SUBTITLE
                                    });
                                });
                                if (sEvent === "TAB_SAVE") {
                                    that.getModel("local").setProperty("/tab_mode", "display");
                                }
                                that.showMessageDialog(aMessageItems);
                                that._oTable.clearSelection();
                                that.getModel().resetChanges();
                                that.getModel().refresh();
                            }, function (oError) {
                                var sMsg;
                                if (oError.error.innererror.errordetails.length > 0) {
                                    sMsg = oError.error.innererror.errordetails[0].message;
                                } else {
                                    sMsg = oError.error.message.value;
                                }
                                MessageBox.error(sMsg);
                            });
                        }
                    },
                    dependentOn: this.getView()
                });
                this.showMessageDialog(aMessageItems);
            }
        },

        showDetailsDialog: function () {
            var that = this;
            this._myBusyDialog.open();
            Fragment.load({
                name: "pp.zpickinglist.fragments.Details",
                controller: this
            }).then(function (oDialog) {
                //ダイアログがロードされたら
                this._oDetailsDialog = oDialog;
                //ダイアログからモデルを使用できるようにする
                this.getView().addDependent(this._oDetailsDialog);
                this._oDetailsDialog.addButton(new sap.m.Button({
                    text: "{i18n>CloseBtn}",
                    press: function () {
                        that.getModel("local").setProperty("/detailSet", []);
                        that._oDetailsDialog.destroy();
                    }
                }));
                this._myBusyDialog.close();
                this._oDetailsDialog.open();
            }.bind(this));
        },

        showMessageDialog: function (aMessageItems) {
            if (aMessageItems.length > 0) {
                this.getModel("local").setProperty("/MessageItems", aMessageItems);
                this._myMessageView.setModel(this.getModel("local"));
                this._myMessageView.navigateBack();
                this.getView().addDependent(this._myMessageDialog);
                this._myMessageDialog.open();
            }
        },

        handleChange: function (oEvent) {
            var sValue, sInputBindingPath, sODataPath, sPath;
            this._oControl = oEvent.getSource();
            var sRowBindingPath = this._oControl.getParent().getBindingContext().getPath();
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
            this._oControl.setValueState("Error");
            sPath = sODataPath + "('" + sValue + "')";

            //----------------------------Custom Logic----------------------------------------
            if (sODataPath === "/ZC_MaterialStockVH") {
                var sMaterial = this.getModel().getProperty(sRowBindingPath + "/Material");
                var sPlant = this.getModel().getProperty(sRowBindingPath + "/Plant");
                sPath = sODataPath + "(Material='" + sMaterial + "',Plant='" + sPlant + "',StorageLocation='" + sValue + "')";
            }
            var sBindFieldName = sInputBindingPath;
            this._CallODataV2("READ", sPath, [], {}, {}).then(function (oResponse) {
                this._oControl.setValueState("None");
                if (sODataPath === "/ZC_MaterialStockVH") {
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName, oResponse["StorageLocation"]);
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Name", oResponse["StorageLocationName"]);
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Stock", oResponse["StockQuantity"]);
                }
            }.bind(this), function (oError) {
                if (sODataPath === "/ZC_MaterialStockVH") {
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Name", "");
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Stock", 0);
                }
            }.bind(this));
            //----------------------------Custom Logic----------------------------------------

            if (!sValue) {
                this._oControl.setValueState("None");
            }
        },

        handleSuggest: function (oEvent) {
            var aFilters = [];
            var oRowData = this.getModel().getProperty(oEvent.getSource().getParent().getBindingContext().getPath());
            aFilters.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oRowData.Plant));
            aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oRowData.Material));
            oEvent.getSource().getBinding("suggestionRows").filter(aFilters);
        }
    });
});
