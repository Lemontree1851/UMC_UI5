sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
],
    function (Base, formatter, xlsx, BusyDialog, MessageBox, Spreadsheet) {
        "use strict";

        return Base.extend("sd.salesacceptance.controller.Main", {
            formatter: formatter,

            onInit: function () {
                this.getRouter().getRoute("Main").attachMatched(this._initialize, this);

            },

            _initialize: function () {
                this._BusyDialog = new BusyDialog();
                // bind attachment path

            },

            onFileChange: function (oEvent) {
                var aExcelSet = [];
                var oFile = oEvent.getParameter("files")[0];
                if (!oFile) {
                    this.getModel("local").setProperty("/excelSet", []);
                    this.getModel("local").setProperty("/logInfo", "");
                    return;
                }
                var oReader = new FileReader();
                oReader.readAsArrayBuffer(oFile);
                this._BusyDialog.open();
                oReader.onload = function (e) {
                    var oWorkBook = XLSX.read(e.target.result, {
                        type: "binary"
                    });
                    var oSheet = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]];
                    var aSheetData = XLSX.utils.sheet_to_row_object_array(oSheet);
                    var sPeriodType = this.byId("periodType").getSelectedKey();
                    var sAcceptPeriod = this.byId("acceptPeriod").getSelectedKey();
                    // read valid data starting from line 3 
                    for (var i = 2; i < aSheetData.length; i++) {
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i - 1,
                            "SalesOrganization": aSheetData[i]["SalesOrganization"],
                            "Customer": aSheetData[i]["Customer"],
                            "PeriodType": sPeriodType,
                            "AcceptPeriod": sAcceptPeriod,
                            "CustomerPO": aSheetData[i]["CustomerPO"],
                            "ItemNo": aSheetData[i]["ItemNo"],
                            "UMCProductCode": aSheetData[i]["UMCProductCode"],
                            "CustomerMaterial": aSheetData[i]["CustomerMaterial"],
                            "CustomerMaterialText": aSheetData[i]["CustomerMaterialText"],
                            "ReceiptDate": aSheetData[i]["ReceiptDate"],
                            "AcceptDate": aSheetData[i]["AcceptDate"],
                            "AcceptQty": aSheetData[i]["AcceptQty"],
                            "ReceiptQty": aSheetData[i]["ReceiptQty"],
                            "UnqualifiedQty": aSheetData[i]["UnqualifiedQty"],
                            "UndersupplyQty": aSheetData[i]["UndersupplyQty"],
                            "AcceptPrice": aSheetData[i]["AcceptPrice"],
                            "AccceptAmount": aSheetData[i]["AccceptAmount"],
                            "Currency": aSheetData[i]["Currency"],
                            "TaxRate": aSheetData[i]["TaxRate"],
                            "OutsideData": aSheetData[i]["OutsideData"]
                        };
                        aExcelSet.push(item);
                    }
                    this.getModel("local").setProperty("/excelSet", aExcelSet);
                    this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, 0, 0]));
                    this.byId("idFileUploader").clear();
                    this._BusyDialog.close();
                }.bind(this);
            },

            onClear: function () {
                this.getModel("local").setProperty("/excelSet", []);
                this.getModel("local").setProperty("/logInfo", "");
            },

            onCheck: function () {
                this._callOData("CHECK");
            },

            onInsert: function () {
                let excelSet = this.getModel("local").getProperty("/excelSet");
                let bError = "";

                excelSet.forEach(function (excel) {
                    if (excel.Status === "E") {
                        bError = "X";
                        return;
                    }
                });
                if (bError === "X") {
                    MessageBox.error(this.getResourceBundle().getText("msg001"));
                    return;
                }

                this._callOData("INSERT");
            },

            onUpdate: function () {
                let excelSet = this.getModel("local").getProperty("/excelSet");
                let bError = "";

                excelSet.forEach(function (excel) {
                    if (excel.Status === "E") {
                        bError = "X";
                        return;
                    }
                });
                if (bError === "X") {
                    MessageBox.error(this.getResourceBundle().getText("msg001"));
                    return;
                }

                this._callOData("UPDATE");
            },

            onDelete: function () {
                let excelSet = this.getModel("local").getProperty("/excelSet");
                let bError = "";

                excelSet.forEach(function (excel) {
                    if (excel.Status === "E") {
                        bError = "X";
                        return;
                    }
                });
                if (bError === "X") {
                    MessageBox.error(this.getResourceBundle().getText("msg001"));
                    return;
                }

                this._callOData("DELETE");
            },

            onAppend: function () {
                let excelSet = this.getModel("local").getProperty("/excelSet");
                let bError = "";

                excelSet.forEach(function (excel) {
                    if (excel.Status === "E") {
                        bError = "X";
                        return;
                    }
                });
                if (bError === "X") {
                    MessageBox.error(this.getResourceBundle().getText("msg001"));
                    return;
                }

                this._callOData("APPEND");
            },

            _callOData: function (bEvent) {
                var sPeriodType = this.byId("periodType").getSelectedKey();
                var sAcceptPeriod = this.byId("acceptPeriod").getSelectedKey();
                var sFinishStatus = this.byId("finishStatus").getSelectedKey();
                var aPromise = [];
                var aExcelSet = this.getModel("local").getProperty("/excelSet");
                var aGroupItems;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    aExcelSet[n].ReceiptDate = formatter.odataDate(aExcelSet[n].ReceiptDate);
                    aExcelSet[n].AcceptDate = formatter.odataDate(aExcelSet[n].AcceptDate);
                    aGroupItems.push(aExcelSet[n]);
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems, sPeriodType, sAcceptPeriod, sFinishStatus));

                try {
                    this._BusyDialog.open();
                    Promise.all(aPromise).then((aContext) => {
                        var oResult = {
                            iSuccess: 0,
                            iFailed: 0
                        };
                        this._BusyDialog.close();
                        var aExcelSet = this.getModel("local").getProperty("/excelSet");
                        for (const activeContext of aContext) {
                            var boundContext = activeContext.getBoundContext();
                            var object = boundContext.getObject();
                            if (bEvent === "CHECK") {
                                JSON.parse(object.Zzkey).forEach(element => {
                                    for (var index = 0; index < aExcelSet.length; index++) {
                                        if (aExcelSet[index].Row === element.ROW) {
                                            aExcelSet[index].Status = element.STATUS;
                                            aExcelSet[index].Message = element.MESSAGE;

                                            if (element.STATUS = 'S') {
                                                oResult.iSuccess += 1;
                                            } else {
                                                oResult.iFailed += 1;
                                            }
                                        }
                                    }
                                });
                                this.getModel("local").setProperty("/excelSet", aExcelSet);
                                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                            } else {
                                JSON.parse(object.Zzkey).forEach(element => {
                                    for (var index = 0; index < aExcelSet.length; index++) {
                                        if (aExcelSet[index].Row === element.ROW) {
                                            if (element.STATUS === 'S') {
                                                MessageBox.success(element.Message);
                                            } else {
                                                MessageBox.error(element.MESSAGE);
                                            }
                                        }
                                        break;
                                    }
                                });
                            }
                        }
                    }).catch((error) => {
                        MessageBox.error(error);
                    }).finally(() => {
                        this._BusyDialog.close();
                    });
                } catch (error) {
                    MessageBox.error(error);
                    this._BusyDialog.close();
                }
            },

            _callODataAction: function (bEvent, aRequestData, sPeriodType, sAcceptPeriod, sFinishStatus) {
                return new Promise((resolve, reject) => {
                    var uploadProcess = this.getModel().bindContext("/SalesAcceptance/com.sap.gateway.srvd.zui_salesacceptance_o4.v0001.processLogic(...)");
                    uploadProcess.setParameter("Event", bEvent);
                    uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                    uploadProcess.setParameter("PeriodType", sPeriodType);
                    uploadProcess.setParameter("AcceptPeriod", sAcceptPeriod);
                    uploadProcess.setParameter("FinishStatus", sFinishStatus);
                    uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                        resolve(uploadProcess);
                    }).catch((error) => {
                        reject(error);
                    });
                });
            },

            onExport: function () {
                // this._callOData("EXPORT");
                var oTable = this.getView().byId("table1");
                var sPath = oTable.getBindingPath("rows");
                var aExcelSet = this.getModel("local").getProperty(sPath);
                
                if (aExcelSet.length === 0) {
                    MessageBox.error(this.getI18nBundle().getText("msgNoDataExport"));
                    return;
                }
                var aExcelCol = [];
                var aTableCol = oTable.getColumns();
                for (var i = 1; i < aTableCol.length; i++) {
                    if (aTableCol[i].getVisible()) {
                        var sLabelText = aTableCol[i].getAggregation("label").getText();
                        var sTemplatePath = aTableCol[i].getAggregation("template").getBindingPath("text");
                        var oExcelCol = {
                            // 获取表格的列名，即设置excel的抬头
                            label: sLabelText,
                            // 数据类型，即设置excel该列的数据类型
                            type: "string",
                        
                            // 获取数据的绑定路径，即设置excel该列的字段路径
                            property: sTemplatePath,
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
                    dataSource: aExcelSet, 
                    fileName: "Export_" + this.getResourceBundle().getText("title") + formatter.formatDate(new Date()) + ".xlsx" // 文件名，需要加上后缀
                };
                
                // 导出excel
                new Spreadsheet(oSettings).build();
            }
        });
    });