sap.ui.define([
    "./Base",
    "./ValueHelpDialog",
    "../model/formatter",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet"
], function (Base, ValueHelpDialog, formatter, BusyDialog, MessageBox, MessageToast, Filter, FilterOperator, Fragment, Spreadsheet) {
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
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
            var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
            var oContextBinding = this.getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
                "$expand": "_AssignPlant,_AssignCompany,_AssignSalesOrg,_AssignPurchOrg,_AssignRole($expand=_UserRoleAccessBtn)"
            });
            oContextBinding.requestObject().then(function (context) {
                var aAccessBtns = [],
                    aAllAccessBtns = [];
                if (context._AssignRole && context._AssignRole.length > 0) {
                    context._AssignRole.forEach(role => {
                        aAccessBtns.push(role._UserRoleAccessBtn);
                    });
                    aAllAccessBtns = aAccessBtns.flat();
                }
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: this.getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                this.getModel("local").setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-View"),
                        Create: aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-Create"),
                        Edit: aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-Edit"),
                        Save: aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-Save"),
                        Delete: aAllAccessBtns.some(btn => btn.AccessId === "zpickinglist-Delete")
                    },
                    data: {
                        PlantSet: context._AssignPlant,
                        CompanySet: context._AssignCompany,
                        SalesOrgSet: context._AssignSalesOrg,
                        PurchOrgSet: context._AssignPurchOrg,
                        RoleSet: context._AssignRole
                    }
                });
            }.bind(this), function (oError) {
                if (!this.oErrorMessageDialog) {
                    this.oErrorMessageDialog = new sap.m.Dialog({
                        type: sap.m.DialogType.Message,
                        state: "Error",
                        content: new sap.m.Text({
                            text: this.getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
        },

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                sRequisitionDate,
                aNewFilters = [];
            var oSmartFilterBar, aFilterPlant = [];
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
                oSmartFilterBar = this.byId("idSmartFilterBar1");
                aFilterPlant.push(oSmartFilterBar.getControlByKey("Plant").getSelectedKey());
            } else {
                oSmartFilterBar = this.byId("idSmartFilterBar2");
                aFilterPlant = oSmartFilterBar.getControlByKey("Plant").getSelectedKeys();
            }

            var bHasError = false;
            var sMessage = "";
            var aAuthorityPlantSet = this.getModel("local").getProperty("/authorityCheck/data/PlantSet");
            aFilterPlant.forEach(sValue => {
                if (!aAuthorityPlantSet.some(data => data.Plant === sValue)) {
                    bHasError = true;
                    if (sMessage === "") {
                        sMessage = sValue;
                    } else {
                        sMessage = sMessage + "、" + sValue;
                    }
                }
            });
            if (bHasError) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("noAuthorityPlant", [sMessage]));
                aFilters.push(new Filter("Plant", FilterOperator.EQ, ''));
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
                var sTitle, sTitleVariable;
                var iExceedsNum = 0;
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
                    if (oRow.PostingStatus === "転記済") {
                        // 入出庫予定 {0} 明細 {1} は転記待データではありません。
                        aMessageItems.push({
                            type: "Error",
                            title: this.getModel("i18n").getResourceBundle().getText("Error"),
                            description: this.getModel("i18n").getResourceBundle().getText("Message8", [oRow.Reservation, oRow.ReservationItem]),
                            subtitle: this.getModel("i18n").getResourceBundle().getText("Message8", [oRow.Reservation, oRow.ReservationItem])
                        });
                    }
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
                        sTitleVariable = this.getModel("i18n").getResourceBundle().getText("Create");
                        break;
                    case "TAB_SAVE":
                        sTitleVariable = this.getModel("i18n").getResourceBundle().getText("Save");
                        break;
                    case "TAB_DELETE":
                        sTitleVariable = this.getModel("i18n").getResourceBundle().getText("Delete");
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
                                // aMessageItems.push({
                                //     type: "Error",
                                //     title: this.getModel("i18n").getResourceBundle().getText("Error"),
                                //     description: this.getModel("i18n").getResourceBundle().getText("Message2", [element.RowNo]),
                                //     subtitle: this.getModel("i18n").getResourceBundle().getText("Message2", [element.RowNo])
                                // });
                                iExceedsNum += 1;
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
                if (iExceedsNum > 0) {
                    sTitle = this.getModel("i18n").getResourceBundle().getText("Message9", [iExceedsNum]);
                } else {
                    sTitle = this.getModel("i18n").getResourceBundle().getText("ConfirmMessage", [sTitleVariable]);
                }
                MessageBox.confirm(sTitle, {
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
                    this.getModel().setProperty(sRowBindingPath + "/M_CARD_Quantity", oResponse["M_CARD_Quantity"]);
                    this.getModel().setProperty(sRowBindingPath + "/M_CARD", oResponse["M_CARD"]);
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
        },

        onBeforeExportStandardList: function (oEvent) {
            var mExcelSettings = oEvent.getParameter("exportSettings");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("StandardListFileName");
            this._exportExcel(mExcelSettings, sFileName);
        },

        onBeforeExportCustomList: function (oEvent) {
            var mExcelSettings = oEvent.getParameter("exportSettings");
            var sFileName = this.getModel("i18n").getResourceBundle().getText("CustomListFileName");
            this._exportExcel(mExcelSettings, sFileName);
        },

        _exportExcel: function (mExcelSettings, sFileName) {
            mExcelSettings.workbook.columns.forEach(function (oColumn) {
                switch (oColumn.property) {
                    //  Date
                    case "CreatedDate":
                    case "LastChangedDate":
                        oColumn.type = sap.ui.export.EdmType.Date;
                        break;
                    //  Number 分隔符 没有小数位
                    case "TotalRequiredQuantity":
                    case "TotalShortFallQuantity":
                    case "StorageLocationToStock":
                    case "M_CARD_Quantity":
                    case "TotalTransferQuantity":
                    case "StorageLocationFromStock":
                    case "GR_SlipsQuantity":
                    case "PostingQuantity":
                        oColumn.type = sap.ui.export.EdmType.Number;
                        oColumn.delimiter = true;
                        oColumn.scale = 3;
                        oColumn.textAlign = "End";
                        oColumn.unitProperty = "BaseUnit";
                        break;
                }
            });
            mExcelSettings.fileName = sFileName + "_" + this.getCurrentDateTime();
        },

        onExportDetails: function () {
            var oTable = sap.ui.getCore().byId("idDetailsTable");
            var sPath = oTable.getBindingPath("rows");
            var aExcelSet = this.getModel("local").getProperty(sPath) ? this.getModel("local").getProperty(sPath) : [];
            var aExcelCol = [];
            var aTableCol = oTable.getColumns();
            for (var i = 0; i < aTableCol.length; i++) {
                if (aTableCol[i].getVisible()) {
                    var sLabelText = aTableCol[i].getAggregation("label").getText();
                    var sType, sTextAlign, sUnitProperty, bDelimiter, iScale;
                    var sFieldName = aTableCol[i].getAggregation("template").mBindingInfos.text.parts[0].path;
                    switch (sFieldName) {
                        //  Date
                        // case "RequisitionDate":
                        //     sType = sap.ui.export.EdmType.Date;
                        //     break;
                        //  Number 分隔符 没有小数位
                        case "TotalRequiredQuantity":
                        case "TotalShortFallQuantity":
                        case "StorageLocationToStock":
                        case "OrderRequiredQuantity":
                        case "ResidueStockQuantity":
                        case "ShortQuantity":
                        case "ConfirmedAvailableQuantity":
                            sType = sap.ui.export.EdmType.Number;
                            bDelimiter = true;
                            iScale = 3;
                            sTextAlign = "End";
                            sUnitProperty = "BaseUnit";
                            break;
                        default:
                            sType = sap.ui.export.EdmType.String;
                            sTextAlign = "Begin";
                            sUnitProperty = "";
                            break;
                    }
                    var oExcelCol = {
                        label: sLabelText,
                        type: sType,
                        property: aTableCol[i].getAggregation("template").getBindingPath("text"),
                        width: parseFloat(aTableCol[i].getWidth()),
                        textAlign: sTextAlign,
                        unitProperty: sUnitProperty,
                        delimiter: bDelimiter,
                        scale: iScale
                    };
                    aExcelCol.push(oExcelCol);
                }
            }
            var oSettings = {
                workbook: {
                    columns: aExcelCol,
                    context: {
                        version: "1.54",
                        hierarchyLevel: "level"
                    }
                },
                dataSource: aExcelSet,
                fileName: this.getModel("i18n").getResourceBundle().getText("DetailsFileName") + "_" + this.getCurrentDateTime() + ".xlsx"
            };
            // export excel file
            new Spreadsheet(oSettings).build();
        }
    });
});
