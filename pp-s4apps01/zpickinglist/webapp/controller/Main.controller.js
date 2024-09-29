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
                    this._myMessageView.navigateBack();
                    oBackButton.setVisible(false);
                }
            });
            this._myMessageDialog = new sap.m.Dialog({
                resizable: true,
                content: this._myMessageView,
                beginButton: new sap.m.Button({
                    press: function () {
                        this._myMessageDialog.close();
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
                sRequisitionDate = this.getModel("local").getProperty("/std_dateValue");
            } else if (sEntitySet === "ZC_PICKINGLIST_TAB") {
                sRequisitionDate = this.getModel("local").getProperty("/tab_dateValue");
            }
            aNewFilters.push(new Filter("RequisitionDate", FilterOperator.EQ, sRequisitionDate));
            if (aNewFilters.length) {
                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: false
                });
                aFilters.push(oNewFilter);
            }
        },

        onSearch: function () {
            this.getModel().resetChanges();
        },

        onPressBtn: function (event) {
            if (event === "STD_EDIT") {
                this.getModel("local").setProperty("/std_mode", "edit");
                return;
            } else if (event === "STD_DISPLAY") {
                this.getModel("local").setProperty("/std_mode", "display");
                return;
            } else if (event === "TAB_EDIT") {
                this.getModel("local").setProperty("/tab_mode", "edit");
                return;
            } else if (event === "TAB_DISPLAY") {
                this.getModel("local").setProperty("/tab_mode", "display");
                return;
            } else {
                if (event.includes("STD")) {
                    this._oTable = this.byId("idStandardListTable");
                } else if (event.includes("TAB")) {
                    this._oTable = this.byId("idCustomListTable");
                }
                var aSelectedItems = this._oTable.getSelectedIndices();
                var iLen = aSelectedItems.length;
                var aItems = [];
                if (!iLen) {
                    MessageBox.error(this.getResourceBundle().getText("NoneSelected"));
                    return;
                }
                while (iLen--) {
                    var sPath = this._oTable.getContextByIndex(aSelectedItems[iLen]).getPath();
                    var oRow = this.getModel().getObject(sPath);
                    aItems.push(oRow);
                }
                var oRequestData = {
                    items: aItems,
                    user: "P00001",
                    username: "Xinlei Xu",
                    datetime: this.getCurrentUTCDateTime()
                }
                this._myBusyDialog.open();
                switch (event) {
                    case "STD_CREATE":
                        break;
                    case "STD_DETAIL":
                        this.showDetailsDialog();
                        break;
                    case "TAB_SAVE":
                        this.getModel("local").setProperty("/tab_mode", "display");
                        break;
                    case "TAB_DELETE":
                        break;
                    case "TAB_DETAIL":
                        this.showDetailsDialog();
                        break;
                    default:
                        break;
                }
                this._myBusyDialog.close();
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
            if (sODataPath === "/I_StorageLocationStdVH") {
                var sPlant = this.getModel().getProperty(sRowBindingPath + "/Plant");
                sPath = sODataPath + "(Plant='" + sPlant + "',StorageLocation='" + sValue + "')";
            }
            var sBindFieldName = sInputBindingPath;
            this._CallODataV2("READ", sPath, [], {}, {}).then(function (oResponse) {
                this._oControl.setValueState("None");
                if (sODataPath === "/I_StorageLocationStdVH") {
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName, oResponse["StorageLocation"]);
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Name", oResponse["StorageLocationName"]);
                }
            }.bind(this), function (oError) {
                if (sODataPath === "/I_StorageLocationStdVH") {
                    this.getModel().setProperty(sRowBindingPath + "/" + sBindFieldName + "Name", "");
                }
            }.bind(this));
            //----------------------------Custom Logic----------------------------------------

            if (!sValue) {
                this._oControl.setValueState("None");
            }
        },
    });
});
