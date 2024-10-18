/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet"
],
function (Base, formatter, xlsx, BusyDialog, MessageBox, MessageToast, Spreadsheet) {
    "use strict";

    return Base.extend("mm.physicalinventoryupload.controller.Main", {
        formatter: formatter,

        onInit: function () {


            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            this._BusyDialog = new BusyDialog();
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
            //this._BusyDialog.open();
            oReader.onload = function (e) {
                var oWorkBook = XLSX.read(e.target.result, {
                    type: "binary"
                });
                var oSheet = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]];
                var aSheetData = XLSX.utils.sheet_to_row_object_array(oSheet);
                // read valid data starting from line 2
                for (var i = 1; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 1,
                        "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                        "StorageLocation": aSheetData[i]["StorageLocation"] === undefined ? "" : aSheetData[i]["StorageLocation"],
                        "InventorySpecialStockType": aSheetData[i]["InventorySpecialStockType"] === undefined ? "" : aSheetData[i]["InventorySpecialStockType"],           
                        "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                        "Supplier": aSheetData[i]["Supplier"] === undefined ? "" : aSheetData[i]["Supplier"],
                        "Quantity": aSheetData[i]["Quantity"] === undefined ? "" : aSheetData[i]["Quantity"],
                        "UnitOfEntry": aSheetData[i]["UnitOfEntry"] === undefined ? "" : aSheetData[i]["UnitOfEntry"],
                        "PhysicalInventoryItemIsZero": aSheetData[i]["PhysicalInventoryItemIsZero"] === undefined ? "" : aSheetData[i]["PhysicalInventoryItemIsZero"],
                        "Batch": aSheetData[i]["Batch"] === undefined ? "" : aSheetData[i]["Batch"],
                        "ReasonForPhysInvtryDifference": aSheetData[i]["ReasonForPhysInvtryDifference"] === undefined ? "" : aSheetData[i]["ReasonForPhysInvtryDifference"],
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

        onExcute: function() {
            this._callOData("EXCUTE"); 
        },

        onSummary: function () {
            var aExcelSet = this.getModel("local").getProperty("/excelSet");
        
            // 创建一个对象用于存储合并的记录
            var oSummaryMap = {};
        
            // 遍历 Excel 数据集
            aExcelSet.forEach(function (item) {
                // 拼接用于判断相同项的唯一键 (品目コード、プラント、保管場所、特殊在庫タイプ、サプライヤ、Batch no)
                var sKey = item.Material + "_" + item.Plant + "_" + item.StorageLocation + "_" + item.InventorySpecialStockType + "_" + item.Supplier + "_" + item.Batch;
        
                // 如果键已存在，则累加数量
                if (oSummaryMap[sKey]) {
                    oSummaryMap[sKey].Quantity = parseFloat(oSummaryMap[sKey].Quantity) + parseFloat(item.Quantity);
                } else {
                    // 如果键不存在，则创建新的条目
                    oSummaryMap[sKey] = {
                        Material: item.Material,
                        Plant: item.Plant,
                        StorageLocation: item.StorageLocation,
                        InventorySpecialStockType: item.InventorySpecialStockType,
                        Supplier: item.Supplier,
                        Batch: item.Batch,
                        Quantity: parseFloat(item.Quantity),
                        Status: "",
                        Message: "",
                        Row: item.Row // 保留初始的 Row 信息
                    };
                }
            });
        
            // 将合并后的对象转换为数组
            var aSummarySet = Object.values(oSummaryMap);
        
            // 更新模型中的 excelSet 为合并后的数据
            this.getModel("local").setProperty("/excelSet", aSummarySet);
        
            // 更新日志信息
            //this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aSummarySet.length, 0, 0]));
        
           // MessageToast.show(this.getResourceBundle().getText("SummaryCompleted"));
        },
        

        _callOData: function(bEvent){
            var aPromise = [];
            var aExcelSet = this.getModel("local").getProperty("/excelSet");
            var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sMaterial = aGroupKey[m].Material;
                const sPlant = aGroupKey[m].Plant;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant) {
                        aGroupItems.push(aExcelSet[n]);
                    }
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems));
            }
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
                        JSON.parse(object.Zzkey).forEach(element => {
                            for (var index = 0; index < aExcelSet.length; index++) {
                                if (aExcelSet[index].Row === element.ROW) {
                                    aExcelSet[index].Status = element.STATUS;
                                    aExcelSet[index].Message = element.MESSAGE;
                                }
                            }
                            if (element.STATUS === 'E') {
                                oResult.iFailed += 1;
                            } else {
                                oResult.iSuccess += 1;
                            }
                        });
                    }
                    this.getModel("local").setProperty("/excelSet", aExcelSet);
                    this.getModel("local").setProperty("/logInfo", this.getModel("i18n").getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                    MessageToast.show(this.getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
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

        _callODataAction: function (bEvent, aRequestData) {
            return new Promise((resolve, reject) => {
                var uploadProcess = this.getModel().bindContext("/PhysicalInventoryUpload/com.sap.gateway.srvd.zui_physicalinventoryupload_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.setParameter("RecordUUID", '');
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
