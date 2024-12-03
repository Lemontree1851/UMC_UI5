sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "sap/m/BusyDialog",
    "sap/ui/core/Messaging",
    "sap/ui/core/Fragment",
	"sap/m/Dialog"
],
    function (Controller, formatter, messages, BusyDialog, Messaging, Fragment, Dialog ) {
        "use strict";
        return Controller.extend("sd.batchcreationdn.controller.Main", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

                this._BusyDialog = new BusyDialog();

                this.getView().setModel(Messaging.getMessageModel(), "message");
                // activate automatic message generation for complete view
                Messaging.registerObject(this.getView(), true);

                var eventBus = this.getOwnerComponent().getEventBus();
			    eventBus.subscribe("channel1","Create", this.callAction.bind(this));
                eventBus.subscribe("channel1","unspecifiedQuantityWarning", this.unspecifiedStorageLocationWarning.bind(this));
                eventBus.subscribe("channel1","unspecifiedStorageLocationWarning", this.createDNConfirmWarning.bind(this));
            },

            onBeforeRebindTable: function () {
                this._oDataModel.resetChanges();
            },

            onDNButtonPress: function (oEvent) {
                if (Messaging.getMessageModel().getData().length !== 0) {
                    var oErrorControlId = this.byId(Messaging.getMessageModel().getData()[0].getControlId());
                    if (oErrorControlId) {
                        oErrorControlId.focus();
                        return;
                    }
                }
                this.aSelectedData = [];
                this.aSelectedData = this.getSelectedRows(oEvent);
                if (this.aSelectedData.length === 0) {
                    return;
                }
                this.unspecifiedQuantityWarning();
            },
            // 第一个警告
            unspecifiedQuantityWarning: function () {
                if ( this.aSelectedData.some(line => Number(line.CurrDeliveryQty) === 0) ) {
                    var sMessageText = this._ResourceBundle.getText("msgUnspecifiedQuantity");
                    messages.confirmAction("Confirmation",sMessageText,"channel1","unspecifiedQuantityWarning",this);
                } else {
                    this.createDNConfirmWarning();
                }
            },
            // 第二个警告
            unspecifiedStorageLocationWarning: function () {
                if ( this.aSelectedData.some(line => line.CurrStorageLocation === "") ) {
                    var sMessageText = this._ResourceBundle.getText("msgUnspecifiedStorageLocation");
                    messages.confirmAction("Confirmation",sMessageText,"channel1","unspecifiedStorageLocationWarning",this);
                } else {
                    this.createDNConfirmWarning();
                }
            },
            // 永远最后一个警告
            createDNConfirmWarning: function () {
                var sMessageText = this._ResourceBundle.getText("msgConfirmation",[this.aSelectedData.length]);
                messages.confirmAction("Confirmation",sMessageText,"channel1","Create",this);
            },
            callAction: function () {
                var that = this;
                var oModel = this._oDataModel;
                oModel.resetChanges();
                oModel.callFunction("/createDeliveryOrder", {
                    method: "POST",
                    urlParameters: {
                        Event: "",
                        Zzkey: JSON.stringify(that.aSelectedData)
                    },
                    success: function (oData) {
                        let result = JSON.parse(oData['createDeliveryOrder'].Zzkey);
                        result.forEach(function (line) {
                            let sKey = `/SalesOrderForDN(SalesDocument='${line.SALESDOCUMENT}',SalesDocumentItem='${line.SALESDOCUMENTITEM}')`;
                            this._oDataModel.setProperty(sKey + "/Type", line.TYPE);
                            this._oDataModel.setProperty(sKey + "/Message", line.MESSAGE);
                            this._oDataModel.setProperty(sKey + "/DeliveryDocument", line.DELIVERYDOCUMENT);
                            this._oDataModel.setProperty(sKey + "/DeliveryDocumentItem", line.DELIVERYDOCUMENTITEM);
                            //还原用户输入的数据
                            let inputParam = that._LocalData.getProperty(sKey);
                            if (inputParam) {
                                this._oDataModel.setProperty(sKey + "/CurrDeliveryQty", inputParam.CurrDeliveryQty || "0");
                                if (inputParam.CurrShippingType) {
                                    this._oDataModel.setProperty(sKey + "/CurrShippingType", inputParam.CurrShippingType);
                                }
                                if (inputParam.CurrPlannedGoodsIssueDate) {
                                    this._oDataModel.setProperty(sKey + "/CurrPlannedGoodsIssueDate", inputParam.CurrPlannedGoodsIssueDate);
                                }
                                if (inputParam.CurrPlannedGoodsIssueDate) {
                                    this._oDataModel.setProperty(sKey + "/CurrDeliveryDate", inputParam.CurrDeliveryDate);
                                }
                                if (inputParam.CurrStorageLocation) {
                                    this._oDataModel.setProperty(sKey + "/CurrStorageLocation", inputParam.CurrStorageLocation);
                                }
                            }
                        },this);
                        this._BusyDialog.close();
                    }.bind(this),
                    error: function (oError) {
                        messages.showError(messages.parseErrors(oError));
                        this._BusyDialog.close();
                    }.bind(this),
                });
                this._BusyDialog.open();
                oModel.submitChanges();
            },
            getSelectedRows: function (oEvent) {
                var that = this;
                // 获取按钮的上下文
                var oButton = oEvent.getSource();

                // 获取按钮所在的表格（假设是 sap.ui.table.Table）
                var oTable = oButton.getParent();

                // 遍历父控件找到 SmartTable 控件
                while (oTable && !(oTable instanceof sap.ui.table.Table || oTable instanceof sap.m.Table)) {
                    oTable = oTable.getParent();
                }

                // 确保找到了表格控件
                if (!oTable) {
                    console.log("未找到表格控件");
                    return;
                }

                // 获取选中的行索引
                var aSelectedIndices = oTable.getSelectedIndices();

                if (aSelectedIndices.length === 0) {
                    messages.showError(this._ResourceBundle.getText("msgNoSelect"));
                    return [];
                }

                // 获取表格绑定的模型
                var oModel = oTable.getModel();

                // 存储选中的行数据
                var aSelectedData = [];

                // 遍历选中的行索引，获取行数据
                aSelectedIndices.forEach(function (iIndex) {
                    var oContext = oTable.getContextByIndex(iIndex);
                    var oRowData = oModel.getProperty(oContext.getPath());
                    var oCopyRowData = JSON.parse(JSON.stringify(oRowData));
                    oCopyRowData.key = oContext.getPath();
                    aSelectedData.push(oCopyRowData);
                });

                return aSelectedData;
            },

            onInputChange: function (oEvent) {
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var sProperty = oEvent.getSource().getBindingPath("value");
                //由于odata的setPoroperty并未真正修改model中的数据，填入的数据在resetchanges之后会消失
                //所以用inputParam存储输入的数据，在创建DN之后用于还原用户输入的数据
                var inputParam = this._LocalData.getProperty(sPath) || {};
                switch (oEvent.getSource().getDataType()) {
                    case 'Edm.DateTime':
                    case 'Edm.Date':
                        this._oDataModel.setProperty(sPath + "/" + sProperty, this.formatter.odataDate(oEvent.getParameter('value')));
                        inputParam = Object.assign(inputParam, {[sProperty]: this.formatter.odataDate(oEvent.getParameter('value'))});
                        break;
                    default:
                        this._oDataModel.setProperty(sPath + "/" + sProperty, oEvent.getParameter('value'));
                        inputParam = Object.assign(inputParam, {[sProperty]: oEvent.getParameter('value')});
                        break;
                }
                this._LocalData.setProperty(sPath,inputParam);
                
            },
            onDialogPress: function (oEvent) {	
                this.aNeedUpdateData = this.getSelectedRows(oEvent);	
                if(this.aNeedUpdateData.length === 0) {
                    return;
                }
                if (!this.Dialog) {
                    var oView = this.getView();
                    if (!this.Dialog) {
                        this.Dialog = Fragment.load({
                            id: oView.getId(),
                            name: "sd.batchcreationdn.view.BatchInput",
                            controller: this
                        }).then(function (oDialog){
                            this.getView().addDependent(oDialog);
                            this.byId("idSmartFormBatchInput").bindElement(this.aNeedUpdateData[0].key);
                            return oDialog;
                        }.bind(this));
                    }
                }
                this.Dialog.then(function(oDialog) {
                    oDialog.open();
                }.bind(this));
            },
            
            onDialogClose: function(){
                this.byId("AnswerDialog").close();
                this.aNeedUpdateData = [];
            },
            onChangeGoodsIssueDate: function () {
                let that = this;
                let sDate = this.byId("idInputParam1").getValue();
                
                that.aNeedUpdateData.forEach(function (line) {
                    that._oDataModel.setProperty(line.key + "/CurrPlannedGoodsIssueDate", that.formatter.odataDate(sDate));
                    let inputParam = that._LocalData.getProperty(line.key) || {};
                    inputParam = Object.assign(inputParam, {"CurrPlannedGoodsIssueDate": that.formatter.odataDate(sDate)});
                    that._LocalData.setProperty(line.key,inputParam);
                });
            },
            onChangeStorageLoc: function () {
                let that = this;
                let sStorageLoc = this.byId("idInputParam2").getValue();
                that.aNeedUpdateData.forEach(function (line) {
                    let inputParam = that._LocalData.getProperty(line.key) || {};
                    that._oDataModel.setProperty(line.key + "/CurrStorageLocation", sStorageLoc);
                    inputParam = Object.assign(inputParam, {"CurrStorageLocation": sStorageLoc});
                    that._LocalData.setProperty(line.key,inputParam);
                });
            }

        });
    });
