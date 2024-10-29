sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "../util/xlsx",
    "sap/m/BusyDialog",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
],
    function (Controller,
        formatter,
        messages,
        xlsx,
        BusyDialog,
        Fragment,
        Filter,
        Sorter) {
        "use strict";
        //不同的搜索帮助设置dialog时用到的各种参数
        /******parameters*****
        helpModel: 搜索帮助的的值路径
        valuePath: 对应的报表的localModel中的property
        headerText: 搜索帮助的字段标题（在i18n文件中的key）
        items:搜索帮助要显示的字段
        */
        /*global Map*/
        var mValueHelp = new Map([
            ["SoldToParty", {
                helpModel: "I_Customer_VH",
                valuePath: "SoldToParty",
                headerTexts: ["SoldToParty", "SoldToPartyName"],
                items: ["Customer", "OrganizationBPName1"]
            }],
        ]);
        return Controller.extend("sd.salesacceptdn.controller.Main", {
            formatter: formatter,
            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._BusyDialog = new BusyDialog();

                // 绑定模板附件path
                var oUploadSet = this.byId("idUploadSet");
                var sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='" + "SAT" +
                    "',DocumentInfoRecordDocNumber='" + "10000000000" + "',DocumentInfoRecordDocVersion='" +
                    "00" + "',DocumentInfoRecordDocPart='" + "000" + "')";
                oUploadSet.bindElement(sPath);
            },


            getMediaUrl: function (sUrlString) {
                if (sUrlString) {
                    var sUrl = new URL(sUrlString);
                    var iStart = sUrl.href.indexOf(sUrl.origin);
                    var sPath = sUrl.href.substring(iStart + sUrl.origin.length, sUrl.href.length);
                    //return "/S4" + sPath;
                    return jQuery.sap.getModulePath("mm.uploadpurchasereq") + sPath;
                } else {
                    return "";
                }
            },

            onFileUploaderChange: function (oEvent) {
                var that = this;
                /*global XLSX*/
                this._LocalData.setProperty("/logInfo", "");
                this._LocalData.setProperty("/recordCheckSuccessed", false);
                var oFile = oEvent.getParameter("files")[0];
                //如果在文件命中匹配到对应的字符串则认为是对应模板
                // if (oFile.name.indexOf("差異まとめ") >= 0) { }

                if (!oFile) {
                    this._LocalData.setProperty("/excelSet", []);
                    return;
                }

                var iBtnIndex = this.byId("idRBGUpload").getSelectedIndex();

                var aExcelSet = [];
                var oItem = {};
                var aHeadSet = [];
                var aItemSet = [];
                var dataKey;
                var oReader = new FileReader();
                oReader.readAsArrayBuffer(oFile); // 将文件读取为数组格式的数据
                oReader.onload = function (e) {
                    this.isEnable = true;
                    // this._BusyDialog.open();
                    // this.byId(this.sSaveButtonId).setEnabled(false);
                    // 获取excel内容，此时是乱码
                    var sResult = e.target.result;
                    // 解码excel内容
                    var oWB = XLSX.read(sResult, {
                        type: "binary",
                        cellDates: true,
                        dateNF: 'yyyy/mm/dd;@',
                    });
                    // 获取sheet1单元格的内容
                    var oSheet1 = oWB.Sheets[oWB.SheetNames[0]];
                    if (iBtnIndex === 0 || iBtnIndex === 1) {
                        // 将单元格的内容转换成数组的形式,从第一行开始读取，将列的字母序号作为属性名称
                        var aSheet1 = XLSX.utils.sheet_to_row_object_array(oSheet1, { header: "A", raw: false });
                        for (var i = 0; i < aSheet1.length; i++) {
                            switch (iBtnIndex) {
                                case 0:
                                    let sRawData = aSheet1[i]["A"] || "";
                                    oItem = {
                                        Type: "",
                                        Message: "",
                                        Row: i,
                                        FileType: iBtnIndex,
                                        PurchaseOrderByCustomer: sRawData.slice(0, 16) || "",
                                        AcceptDate: sRawData.slice(16, 24) || "",
                                        Product: sRawData.slice(24, 42) || "",
                                        AcceptQuantity: Number(sRawData.slice(42, 47)) || "0",
                                    }
                                    break;
                                case 1:
                                    oItem = {
                                        Type: "",
                                        Message: "",
                                        Row: i,
                                        FileType: iBtnIndex,
                                        PurchaseFrom: aSheet1[i]["D"] || "",
                                        SoldTo: aSheet1[i]["E"] || "",
                                        PurchaseOrderByCustomer: aSheet1[i]["G"] || "",
                                        Product: aSheet1[i]["S"] || "",
                                        AcceptQuantity: Number(aSheet1[i]["AD"]) || "0",
                                        AcceptDate: aSheet1[i]["AE"] || "",
                                    }
                                    break;
                            }
                            var sSoldToParty = this.byId("idSoldToParty").getValue();
                            if (sSoldToParty) {
                                oItem.SoldToParty = sSoldToParty;
                            }
                            aExcelSet.push(this.convertObjectValuesToString(oItem));
                        }
                    } else if (iBtnIndex === 2) {
                        // 将单元格的内容转换成数组的形式（自动将第一行作为抬头）
                        var aSheet1 = XLSX.utils.sheet_to_row_object_array(oSheet1);
                        // for循环每一行的内容添加到数据集当中,数据从第excel的2行开始（第一行默认为技术字段，不读取）
                        for (var i = 1; i < aSheet1.length; i++) {
                            oItem = {
                                Type: "",
                                Message: "",
                                Row: i,
                                FileType: iBtnIndex,
                                PurchaseFrom: aSheet1[i]["PurchaseFrom"] || "",
                                SoldTo: aSheet1[i]["SoldTo"] || "",
                                PurchaseOrderByCustomer: aSheet1[i]["PurchaseOrderByCustomer"] || "",
                                AcceptDate: aSheet1[i]["AcceptDate"] || "",
                                Product: aSheet1[i]["Product"] || "",
                                AcceptQuantity: Number(aSheet1[i]["AcceptQuantity"]) || "",
                            }
                            var sSoldToParty = this.byId("idSoldToParty").getValue();
                            if (sSoldToParty) {
                                oItem.SoldToParty = sSoldToParty;
                            }
                            aExcelSet.push(this.convertObjectValuesToString(oItem));
                        }
                    }
                    if (aExcelSet.length === 0) {
                        return;
                    }
                    this.getSalesDocumentForDN(aExcelSet).then(function (records) {
                        that.getErrorCount(records);
                        that._LocalData.setProperty("/excelSet", records)
                    }).finally(function () {
                        that._BusyDialog.close();
                    });

                }.bind(this);
            },

            convertObjectValuesToString: function (obj) {
                return Object.fromEntries(
                    Object.entries(obj).map(([key, value]) => [key, String(value)])
                );
            },

            onCreateDN: function () {
                var that = this;
                var aExcelSet = this._LocalData.getProperty("/excelSet");
                this._BusyDialog.open();
                this.postAction("createDN", aExcelSet).then(records => {
                    that._LocalData.setProperty("/excelSet", records)
                }).finally(function () {
                    that._BusyDialog.close();
                });
            },

            getSalesDocumentForDN: function (aExcelSet) {
                // let aExcelSet = this._LocalData.getProperty("/excelSet");
                this._BusyDialog.open();
                return this.postAction("checkRecords", aExcelSet);
            },

            postAction: function (sActionName, items) {
                var that = this;
                var promise = new Promise(function (resolve, reject) {
                    var oAction = that._oDataModel.bindContext("/DNProcess/com.sap.gateway.srvd.zui_salesaccept_dnprocess_o4.v0001." + sActionName + "(...)");
                    oAction.setParameter("Zzkey", JSON.stringify(items));
                    oAction.setParameter("Event", "");
                    oAction.setParameter("RecordUUID", "");

                    oAction.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        try {
                            var records = oAction.getBoundContext().getObject().value; //获取返回的数据
                        } catch (e) { }
                        resolve(records);

                    }).catch((oError) => {
                        messages.showError(oError.message);
                        reject(oError);
                    });
                });
                return promise;
            },

            getErrorCount: function (aExcelSet) {
                var iTotal = 0,
                    iError = 0,
                    iSuccess = 0;
                iTotal = aExcelSet.length;
                aExcelSet.forEach(function (value) {
                    if (value.Type === "E") {
                        iError++;
                    } else {
                        iSuccess++;
                    }
                });
                var sLogInfo = this._ResourceBundle.getText("logInfo", [iTotal, iSuccess, iError]);
                this._LocalData.setProperty("/logInfo", sLogInfo);
                if (iError > 0) {
                    return;
                }
                this._LocalData.setProperty("/recordCheckSuccessed", true);

            },

            //Check the value of fields with search help
            onValueChange: function (oEvent, propertyKey) {
                // 如果对应的字段有搜索帮助，则校验输入的值在不在搜索帮助中
                var valueHelpParameters = mValueHelp.get(propertyKey);
                var aCompanyCodeVH = this._LocalData.getProperty("/" + valueHelpParameters.helpModel);
                if (aCompanyCodeVH.find(c => c[valueHelpParameters.items[0]] === oEvent.getParameter("value"))) {
                    this.byId(oEvent.getSource().getId()).setValueState("None");
                } else {
                    this.byId(oEvent.getSource().getId()).setValueState("Error");
                }
            },

            //Control is required, so the control state is changed when the control has a value
            onChangeValueState: function (oEvent) {
                if (oEvent.getParameter("value")) {
                    this.byId(oEvent.getSource().getId()).setValueState("None");
                }
            },
            // Control is required, so the control state is changed when the control has a value
            onSelectChangeValueState: function (oEvent) {
                if (oEvent.getSource().getSelectedKey()) {
                    oEvent.getSource().setValueState("None");
                }
            },

            // Custom search help pop-up
            onPressValueHelp: function (oEvent, isHeadData, propertyKey) {
                var oView = this.getView();
                this.oInput = oEvent.getSource();
                var sRowPath;
                if (isHeadData) {
                	sRowPath = oEvent.getSource().getBindingInfo("value").binding.sPath;
                	sRowPath = sRowPath.replace("/" + propertyKey, "");
                } else {
                	sRowPath = oEvent.getSource().getBindingContext("local").getPath();
                }

                // create value help dialog
                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "sd.salesacceptdn.view.ValueHelpDialog",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    }.bind(this));
                }
                // open value help dialog
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    //设置dialog的显示内容
                    var valueHelpParameters = mValueHelp.get(propertyKey);
                    if (!valueHelpParameters) {
                        return;
                    }

                    //解除confirm事件的绑定，因为会多次点击，如果不解除绑定则会绑定多次，会多次进入事件，且除第一次之外，其他没有传入参数
                    oValueHelpDialog.detachConfirm(this._handleValueHelpClose);
                    //绑定Dialog列表的confirm事件
                    //绑定时传入所在行的绑定路径 sRowPath
                    oValueHelpDialog.attachConfirm(
                        {
                            isHead: isHeadData,//判断是否是抬头数据，用来设置input的description
                            path: sRowPath,
                            object: this,
                            valueHelpParameters: valueHelpParameters
                        },
                        this._handleValueHelpClose
                    );

                    //解除search事件的绑定
                    oValueHelpDialog.detachSearch(this._handleValueHelpSearch);
                    //绑定Dialog列表的search事件 同时传入filter需要的key值
                    oValueHelpDialog.attachSearch({ valueHelpParameters: valueHelpParameters }, this._handleValueHelpSearch);

                    //设置表头的数组
                    var aHeaderTexts = valueHelpParameters.headerTexts;
                    //设置标题
                    oValueHelpDialog.setTitle(this._ResourceBundle.getText(aHeaderTexts[0]));
                    //设置dialog宽度
                    var iContentWidth = (aHeaderTexts.length - 1) * 15 + 7;
                    oValueHelpDialog.setContentWidth(iContentWidth + "rem");
                    //设置列字段的数组
                    var aItems = valueHelpParameters.items;
                    //数据的绑定路径
                    var sBindingPath = "/" + valueHelpParameters.helpModel;
                    //搜索帮助用来排序的字段(默认显示的第一个字段)
                    var sSortKey = valueHelpParameters.items[0];

                    //创建columns
                    var aColumns = [];
                    aHeaderTexts.forEach(function (headerText, index) {
                        if (this.byId("Column" + index)) {
                            this.byId("Column" + index).destroy(true);
                        }
                        var iWidth = index === 0 ? 10 : 15;
                        aColumns.push(new sap.m.Column({
                            id: this.getView().createId("Column" + index),
                            width: iWidth + "rem",
                            header: new sap.m.Label({
                                text: this._ResourceBundle.getText(headerText)
                            })
                        }));
                    }.bind(this));
                    //将column添加到dialog中
                    oValueHelpDialog.destroyColumns();
                    aColumns.forEach(function (oColumn, index) {
                        oValueHelpDialog.addColumn(oColumn);
                    }.bind(this));
                    //创建items
                    var aCells = [];
                    aItems.forEach(function (cell) {
                        // var cellPath = "{local>" + cell + "}";
                        var cellPath = "{" + cell + "}";
                        aCells.push(
                            new sap.m.Text({
                                text: cellPath
                            })
                        );
                    });
                    var oItems = new sap.m.ColumnListItem({ cells: aCells });
                    var oSorter = new Sorter({
                        path: sSortKey,
                        descending: false
                    });
                    //将item添加到dialog中
                    oValueHelpDialog.bindAggregation("items", {
                        path: sBindingPath,
                        template: oItems,
                        sorter: oSorter
                    });

                    oValueHelpDialog.open();
                }.bind(this));
            },

            // Search controls in the search help pop-up
            _handleValueHelpSearch: function (oEvent, obj) {
                // obj: 设置valueHelpDialog的参数，这里是获取搜索帮助filter时需要的property
                var sValue = oEvent.getParameter("value");
                var aFilter = [];
                obj.valueHelpParameters.items.forEach(function (value) {
                    aFilter.push(new Filter(value, "Contains", sValue));
                })
                var oFilter = new Filter({
                    filters: aFilter,
                    and: false
                });
                oEvent.getSource().getBinding("items").filter(oFilter);
            },

            // Behavior when a record is selected in the search help pop-up window
            _handleValueHelpClose: function (oEvent, obj) {
                // obj.object: controller的this
                var oSelectedItem = oEvent.getParameter("selectedItem");
                //选中行时关闭dialog
                //将获取到的搜索帮助的值写入对应行的localmodel
                if (oSelectedItem) {
                    var that = obj.object;
                    var sRowPath = obj.path;//数据所在行的绑定路径
                    //items[0] 第一个参数作为作为要获取的搜索帮助值
                    var sSelectedValue = oSelectedItem.getBindingContext().getObject()[obj.valueHelpParameters.items[0]]
                    that._LocalData.setProperty(sRowPath, sSelectedValue);
                    that.oInput.setValueState("None");
                }
                oEvent.getSource().getBinding("items").filter([]);
            },
        });
    });
