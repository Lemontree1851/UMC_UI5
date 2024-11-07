sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "../util/xlsx",
    "sap/m/BusyDialog",
    "sap/ui/export/Spreadsheet"
], function (
    Controller, formatter, messages, xlsx, BusyDialog, Spreadsheet
) {
    "use strict";

    return Controller.extend("mm.uploadpurchasereq.controller.Upload", {
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
            /*global XLSX*/
            this._LocalData.setProperty("/logInfo", "");
            // var oFile = oEvent.getSource().getFocusDomRef().files[0];
            var oFile = oEvent.getParameter("files")[0];
            //如果在文件命中匹配到对应的字符串则认为是对应模板
            // if (oFile.name.indexOf("差異まとめ") >= 0) { }

            if (!oFile) {
                this._LocalData.setProperty("/excelSet", []);
                return;
            }

            var aExcelSet = [];
            var oItem = {};
            var aHeadSet = [];
            var aItemSet = [];
            var dataKey;
            var oReader = new FileReader();
            oReader.readAsArrayBuffer(oFile); // 将文件读取为数组格式的数据
            oReader.onload = function (e) {
                this.isEnable = true;
                this._BusyDialog.open();
                // this.byId(this.sSaveButtonId).setEnabled(false);
                // 获取excel内容，此时是乱码
                var sResult = e.target.result;
                // 解码excel内容
                var oWB = XLSX.read(sResult, {
                    type: "binary",
                    cellDates: true,
                    dateNF: 'yyyy/mm/dd;@'
                });
                // 获取sheet1单元格的内容
                var oSheet1 = oWB.Sheets[oWB.SheetNames[0]];
                // 将单元格的内容转换成数组的形式（自动将第一行作为抬头）
                var aSheet1 = XLSX.utils.sheet_to_row_object_array(oSheet1, {raw: false});
                // for循环每一行的内容添加到数据集当中,数据从第excel的3行开始（第一行默认为技术字段，不读取，第二行为说明行，JS中从0开始，所以从1开始读）
                var pritem = 0;
                for (var i = 1; i < aSheet1.length; i++) {
                    pritem++;
                    oItem = {
                        Type: "",
                        Message: "",
                        Row: i,
                        ApplyDepart: aSheet1[i]["ApplyDepart"] || "",
                        PrNo: aSheet1[i]["PrNo"] || "",
                        PrItem: pritem,
                        PrType: aSheet1[i]["PrType"] || "",
                        OrderType: aSheet1[i]["OrderType"] || "",
                        Supplier: aSheet1[i]["Supplier"] || "",
                        CompanyCode: aSheet1[i]["CompanyCode"] || "",
                        PurchaseOrg: aSheet1[i]["PurchaseOrg"] || "",
                        PurchaseGrp: aSheet1[i]["PurchaseGrp"] || "",
                        Plant: aSheet1[i]["Plant"] || "",
                        Currency: aSheet1[i]["Currency"] || "",
                        ItemCategory: aSheet1[i]["ItemCategory"] || "",
                        AccountType: aSheet1[i]["AccountType"] || "",
                        MatID: aSheet1[i]["MatID"] || "",
                        MatDesc: aSheet1[i]["MatDesc"] || "",
                        MaterialGroup: aSheet1[i]["MaterialGroup"] || "",
                        Quantity: aSheet1[i]["Quantity"] || "0",
                        Unit: aSheet1[i]["Unit"] || "",
                        Price: aSheet1[i]["Price"] || "0",
                        UnitPrice: aSheet1[i]["UnitPrice"] || "0",
                        // DeliveryDate: formatter.convertISOString(aSheet1[i]["DeliveryDate"]) || "",
                        DeliveryDate: aSheet1[i]["DeliveryDate"] || "",
                        Location: aSheet1[i]["Location"] || "",
                        ReturnItem: aSheet1[i]["ReturnItem"] || "",
                        Free: aSheet1[i]["Free"] || "",
                        GlAccount: aSheet1[i]["GlAccount"] || "",
                        CostCenter: aSheet1[i]["CostCenter"] || "",
                        WbsElemnt: aSheet1[i]["WbsElemnt"] || "",
                        AssetNo: aSheet1[i]["AssetNo"] || "",
                        Tax: aSheet1[i]["Tax"] || "",
                        ItemText: aSheet1[i]["ItemText"] || "",
                        PrBy: aSheet1[i]["PrBy"] || "",
                        TrackNo: aSheet1[i]["TrackNo"] || "",
                        Ean: aSheet1[i]["Ean"] || "",
                        CustomerRec: aSheet1[i]["CustomerRec"] || "",
                        AssetOri: aSheet1[i]["AssetOri"] || "",
                        MemoText: aSheet1[i]["MemoText"] || "",
                        BuyPurpoose: aSheet1[i]["BuyPurpoose"] || "",
                        PurchaseOrder: aSheet1[i]["PurchaseOrder"] || "",
                        PurchaseOrderItem: aSheet1[i]["PurchaseOrderItem"] || "",
                        IsLink: aSheet1[i]["IsLink"] || "",
                        Kyoten: aSheet1[i]["Kyoten"] || "",
                        IsApprove: aSheet1[i]["IsApprove"] || "",
                    };
                    aExcelSet.push(oItem);
                }
                if (this.checkInconsistencies(aExcelSet)) {
                    this.byId("idCheckButton").setEnabled(false);
                } else {
                    this.byId("idCheckButton").setEnabled(true);
                }

                this._LocalData.setProperty("/excelSet", aExcelSet)
                this._BusyDialog.close();
                this._LocalData.setProperty("/recordCheckSuccessed", false);
            }.bind(this);
        },

        checkInconsistencies: function (aExcelSet) {
            let isInconsistencies = false;
            // 如果数组为空或只有一个对象，直接返回一致
            if (aExcelSet.length <= 1) return false;

            // 取第一个对象的这四个属性作为比较基准
            const { ApplyDepart, PrType, OrderType, Kyoten, CompanyCode } = aExcelSet[0];

            // 先检查公司代码是否一致
            for (let i = 1; i < aExcelSet.length; i++) {
                const obj = aExcelSet[i];
                if (obj.CompanyCode !== CompanyCode) {
                    aExcelSet[i].Type = "E";
                    aExcelSet[i].Message = this._ResourceBundle.getText("msgDuplicate");
                    isInconsistencies = true; // 发现不一致，返回 true
                }
            }
            if(!isInconsistencies) {
                // 遍历数组，检查每个对象的这四个属性是否与基准一致
                for (let i = 1; i < aExcelSet.length; i++) {
                    const obj = aExcelSet[i];
                    if (obj.CompanyCode === "1400") {
                        if (
                            obj.ApplyDepart !== ApplyDepart ||
                            obj.OrderType !== OrderType
                        ) {
                            isInconsistencies = true; // 发现不一致，返回 true
                        }
                    } else {
                        if (
                            obj.ApplyDepart !== ApplyDepart ||
                            obj.PrType !== PrType ||
                            obj.OrderType !== OrderType ||
                            obj.Kyoten !== Kyoten
                        ) {
                            isInconsistencies = true; // 发现不一致，返回 true
                        }
                    }
                    if (isInconsistencies) {
                        aExcelSet[i].Type = "E";
                        aExcelSet[i].Message = this._ResourceBundle.getText("msgDuplicate");
                    }
                }
            }
            return isInconsistencies; // 所有对象都一致，返回 false
        },

        convertObjectValuesToString: function (obj) {
            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [key, String(value)])
            );
        },

        getErrorCount: function (aExcelSet, sAction) {
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
            switch (sAction) {
                case "check":
                    this._LocalData.setProperty("/recordCheckSuccessed", true);
                    break;
                case "save":
                    this._LocalData.setProperty("/recordCheckSuccessed", false);
                    break;
            }
        },

        onButtonCheckPress: function () {
            let postDocs = this.preparePostBody();
            let oModel = this._oDataModel,
                aDeferredGroups = oModel.getDeferredGroups();
            aDeferredGroups = aDeferredGroups.concat(["UploadHead0"]);
            oModel.setDeferredGroups(aDeferredGroups);
            for (var i = 0; i < postDocs.length; i++) {
                this.postCreate(postDocs[i], i);
            }
            oModel.submitChanges({ groupId: "UploadHead0" });
        },

        onButtonPress: function (oEvent, sAction) {
            let postDocs = this.preparePostBatchBody();
            for (var i = 0; i < postDocs.length; i++) {
                this.postAction(sAction, postDocs[i], i);
            }
        },

        preparePostBody: function () {
            let aExcelSet = this._LocalData.getProperty("/excelSet"),
                postDocs = [],
                postDoc,
                post = [];

            aExcelSet.forEach(function (line) {
                post.push(JSON.parse(JSON.stringify(line)));
            }, this);

            postDocs = post;
            return postDocs;
        },
        preparePostBatchBody: function () {
            let aExcelSet = this._LocalData.getProperty("/excelSet");
            let copyExcelSet = [];
            aExcelSet.forEach(item => {
                let postDoc = JSON.parse(JSON.stringify(item));
                postDoc.Type = "";
                postDoc.Message = "";
                postDoc.DeliveryDate = postDoc.DeliveryDate.replace(/[-/]/g, "");
                copyExcelSet.push(postDoc);
            }, this)
            let postDocs = [JSON.stringify(copyExcelSet)];
            return postDocs;
        },
        postAction: function (sAction, postData, i) {
            var oModel = this._oDataModel;
            // aDeferredGroups = oModel.getDeferredGroups();
            // aDeferredGroups = aDeferredGroups.concat(["myId"]);
            // oModel.setDeferredGroups(aDeferredGroups);

            oModel.callFunction("/batchProcess", {
                method: "POST",
                // groupId: "myId",//如果设置groupid，会多条一起进入action
                changeSetId: i,
                //建议只传输前端修改的参数，其他字段从后端获取
                urlParameters: {
                    Event: sAction,
                    Zzkey: postData
                },
                success: function (oData) {
                    let aExcelSet = this._LocalData.getProperty("/excelSet");
                    let result = JSON.parse(oData["batchProcess"].Zzkey);
                    result.forEach(function (line) {
                        for (let i = 0; i < aExcelSet.length; i++) {
                            if (aExcelSet[i].Row == line.ROW) {
                                Object.keys(aExcelSet[0]).forEach(function (key) {
                                    if (key !== "Row") {
                                        aExcelSet[i][key] = line[key.toUpperCase()];
                                    }
                                });
                                // aExcelSet[i].Type = line.TYPE;
                                // aExcelSet[i].Message = line.MESSAGE;
                            }
                        }
                    });
                    this._LocalData.setProperty("/excelSet", aExcelSet);
                    this.getErrorCount(aExcelSet, sAction);
                }.bind(this),
                error: function (oError) {
                    this._LocalData.setProperty("/recordCheckSuccessed", false);
                    messages.showError(messages.parseErrors(oError));
                }.bind(this)
            });
            // oModel.submitChanges({ groupId: "myId" });
        },
        postCreate: function (postData, i) {
            delete postData.Type;
            delete postData.Message;
            let mParameters = {
                groupId: "UploadHead" + Math.floor(i / 100),
                // changeSetId: i,
                success: function (oData) {
                    // var aExcelSet = this._LocalData.getProperty("/excelSet");
                    // aExcelSet.forEach(function (line) {
                    // 	line.Type = oData.Type;
                    // 	line.Message = oData.Message;
                    // });
                }.bind(this),
                error: function (oError) {
                    // var aExcelSet = this._LocalData.getProperty("/excelSet");
                    // aExcelSet.forEach(function (line) {
                    // 	line.Type = "E";
                    // 	line.Message = messages.parseErrors(oError,line.Datanumber);
                    // });
                }.bind(this)
            };
            this.getOwnerComponent().getModel().create("/PurchaseReq", postData, mParameters);
        },

        onExport: function (oEvent) {
            // 根据id值获取table 
            var oTable = this.getView().byId("idTable");
            // 获取table的绑定路径
            var sPath = oTable.getBindingPath("rows");
            // 获取table数据
            var aExcelSet = this._LocalData.getProperty(sPath);

            var aExcelCol = [];
            // 获取table的columns
            var aTableCol = oTable.getColumns();
            for (var i = 1; i < aTableCol.length; i++) {
                if (aTableCol[i].getVisible()) {
                    var sLabelText = aTableCol[i].getAggregation("label").getText();
                    var oExcelCol = {
                        // 获取表格的列名，即设置excel的抬头
                        label: sLabelText,
                        // 数据类型，即设置excel该列的数据类型
                        type: "string",
                        // 获取数据的绑定路径，即设置excel该列的字段路径
                        property: aTableCol[i].getAggregation("template").getBindingPath("text"),
                        // 获取表格的width属性，即设置excel该列的长度
                        width: parseFloat(aTableCol[i].getWidth())
                    };
                    aExcelCol.push(oExcelCol);
                }
            }
            // 设置excel的相关属性
            var oSettings = {
                workbook: {
                    columns: aExcelCol,
                    context: {
                        version: "1.54",
                        hierarchyLevel: "level"
                    }
                },
                dataSource: aExcelSet, // 传入参数，数据源
                fileName: "Export_" + this._ResourceBundle.getText("title") + new Date().getTime() + ".xlsx" // 文件名，需要加上后缀
            };
            // 导出excel
            new Spreadsheet(oSettings).build();
        },
    });
});