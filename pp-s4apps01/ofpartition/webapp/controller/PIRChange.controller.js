sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "../util/xlsx",
    "sap/m/BusyDialog",
    "sap/ui/export/Spreadsheet"
], function (
    Controller,
    formatter,
    messages,
    xlsx,
    BusyDialog,
    Spreadsheet
) {
    "use strict";

    return Controller.extend("pp.ofpartition.controller.PIRUpload", {
        formatter : formatter,
        onInit: function () {
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this._BusyDialog = new BusyDialog();


            // // 绑定模板附件path
			// var oUploadSet = this.byId("idUploadSet");
			// var sPath = "Attach>/A_DocumentInfoRecordAttch(DocumentInfoRecordDocType='" + "SAT" +
			// 	"',DocumentInfoRecordDocNumber='" + "10000000000" + "',DocumentInfoRecordDocVersion='" +
			// 	"00" + "',DocumentInfoRecordDocPart='" + "000" + "')";
			// oUploadSet.bindElement(sPath);
            
        },

        // getMediaUrl: function (sUrlString) {
		// 	if (sUrlString) {
		// 		var sUrl = new URL(sUrlString);
		// 		var iStart = sUrl.href.indexOf(sUrl.origin);
		// 		var sPath = sUrl.href.substring(iStart + sUrl.origin.length, sUrl.href.length);
		// 		//return "/S4" + sPath;
		// 		return jQuery.sap.getModulePath("mm.uploadpurchasereq") + sPath;
		// 	} else {
		// 		return "";
		// 	}
		// },

        onFileUploaderChange: function (oEvent) {
            /*global XLSX*/
            this._LocalData.setProperty("/logInfo", "");
            // var oFile = oEvent.getSource().getFocusDomRef().files[0];
            var oFile = oEvent.getParameter("files")[0];
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
                var aSheet1 = XLSX.utils.sheet_to_row_object_array(oSheet1);
                // for循环每一行的内容添加到数据集当中,数据从第excel的3行开始（第一行默认为技术字段，不读取）
                for (var i = 0; i < aSheet1.length; i++) {
                    oItem = {
                        Type: "",
                        Message: "",
                        Customer: aSheet1[i]["得意先"] || "",
                        Plant: aSheet1[i]["プラント"] || "",
                        Material: aSheet1[i]["品目"] || "",
						MaterialByCustomer: aSheet1[i]["得意先品目"] || "",
						MaterialName: aSheet1[i]["品目テキスト"] || "",
                    };
                    const regex = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/;
                    Object.keys(aSheet1[i]).forEach(function (key) {
                        if ( regex.test(key) ) {
                            oItem[`ReqDate${key}`] = aSheet1[i][key].toString() || "0";
                        }
                    });
                    aExcelSet.push(oItem);
                }

                this._LocalData.setProperty("/excelSet", aExcelSet);
                this.addColumns();
				this._LocalData.setProperty("/isRecordCheckSuccessed", false);
                this._BusyDialog.close();
            }.bind(this);
        },
        addColumns: function () {
			var ofpartition = this._LocalData.getProperty("/excelSet");
			if (ofpartition.length > 0) {
				Object.keys(ofpartition[0]).forEach(function (key) {
					if (key.indexOf("ReqDate") >= 0) {
						this.addColumn(key, this);
					}
				}.bind(this));
			}
		},

		addColumn: function(sColName,oObj){
			// var sId = sColName + index;
			// if (oObj.byId(sId)){
			// 	oObj.byId(sId).destroy(true);
			// }
			var oText = new sap.m.Text({
							text : "{local>" + sColName + "}",
					    	wrapping: false,
					    	tooltip:"{local>" + sColName + "}"
						});
			var sLabel = sColName.slice(7);
			var oCustomDataValue = {columnKey: sColName, leadingProperty: sColName};
			var sWidth = "8rem";
			var shAlign = "Begin";
			if (sColName.indexOf("ReqDate") >= 0) {
				shAlign = "End";
			}
			var sId = oObj.getView().createId(sColName);
			if (oObj.byId(sId)){
				oObj.byId(sId).destroyLabel();
				oObj.byId(sId).destroyTemplate();
				oObj.byId(sId).destroy(true);
			}
			var oColumn = new sap.ui.table.Column({
					id: oObj.getView().createId(sColName),
					hAlign: shAlign,
					label: sLabel,
					width: sWidth,
					template: oText,
					// customData: new sap.ui.core.CustomData({
					// 				key: "p13nData",
					// 				value: oCustomDataValue
					// 			})
				});
			oObj.getView().byId("idUploadTable").addColumn(oColumn);
		},

        onCheckRecords: function () {
			var aOFPartition = this._LocalData.getProperty("/excelSet");
            var aPromise = [];
			var that = this;
			this._BusyDialog.open();
            aOFPartition.forEach( function (line){
				var promise = new Promise((resolve, reject) => {
                    var createPrintRecord = this.getOwnerComponent().getModel("pir").bindContext("/ZC_CREATEPIR/com.sap.gateway.srvd.zui_createpir_o4.v0001.checkRecords(...)");
                    createPrintRecord.setParameter("Customer", line.Customer);
					createPrintRecord.setParameter("Plant", line.Plant);
					createPrintRecord.setParameter("Material", line.Material);
                    createPrintRecord.setParameter("Type", "");
                    createPrintRecord.setParameter("Message", "");
                    createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then((odata) => {
                        var object = createPrintRecord.getBoundContext().getObject(); //获取返回的数据
						// 更新message
						const searchKey = `${object.Customer}_${object.Plant}_${object.Material}`;
						let item = aOFPartition.find(item => {
							const key = `${item.Customer}_${item.Plant}_${item.Material}`;
							return key === searchKey;
						});
						if (item) {
							item.Type = object.Type;
							item.Message = object.Message;
						}
						that._LocalData.setProperty("/excelSet", aOFPartition);
						// 只有所有条目检查成功时才能修改
						that.getErrorCount(aOFPartition);
						resolve();
                    }).catch((oError) => {
						this._LocalData.setProperty("/isRecordCheckSuccessed", false);
                        console.log(oError.error);
                        // reject(oError);
						resolve();
                    });
                });
                aPromise.push(promise);
            }.bind(this));

			Promise.all(aPromise).then(function () {
			}).finally(function () {
				that._BusyDialog.close();
			});
		},

        onPIRChange: function () {
            var aOFPartition = this._LocalData.getProperty("/excelSet");
			var aSelectedItem = this.preparePostBody();
			var aPromise = [];
			var that = this;
			var processDate = this.getDates();
			aSelectedItem.forEach( function (line){
				var promise = new Promise((resolve, reject) => {
					var createPrintRecord = this.getOwnerComponent().getModel("pir").bindContext("/ZC_CREATEPIR/com.sap.gateway.srvd.zui_createpir_o4.v0001.processOFPartition(...)");
					createPrintRecord.setParameter("Customer", line.Customer);
					createPrintRecord.setParameter("Plant", line.Plant);
					createPrintRecord.setParameter("Material", line.Material);
					createPrintRecord.setParameter("ProcessStart", processDate.firstDayOfCurrentMonth);
					createPrintRecord.setParameter("ProcessEnd", processDate.lastDayOfFutureMonth);
					createPrintRecord.setParameter("Type", "");
					createPrintRecord.setParameter("Message", "");

					var aOrginalItem = that.transformBack(line);
					createPrintRecord.setParameter("_Item", aOrginalItem);
					// var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
					// createPrintRecord.setParameter("ProvidedKeys", JSON.stringify({ Uuid: uuidx16.toUpperCase() }));
					// createPrintRecord.setParameter("ResultIsActiveEntity", true);
					that._BusyDialog.open();
					createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then((odata) => {
						resolve(createPrintRecord);
						var object = createPrintRecord.getBoundContext().getObject(); //获取返回的数据
						// 更新message
						const searchKey = `${object.Customer}_${object.Plant}_${object.Material}`;
						let item = aOFPartition.find(item => {
							const key = `${item.Customer}_${item.Plant}_${item.Material}`;
							return key === searchKey;
						});
						if (item) {
							item.Type = object.Type;
							item.Message = object.Message;
						}
						// 更新pir数据
						object._Item.forEach(function (line) {
							const date = line.RequirementDate;
							if (item) {
								item[`ReqDate${date}`] = line.RequirementQty;
							}
						});
						that._LocalData.setProperty("/excelSet", aOFPartition);
					}).catch((oError) => {
						messages.showError(messages.parseErrors(oError));
						reject(oError);
					});
				});
				aPromise.push(promise);
			}.bind(this));

			Promise.all(aPromise).then(function () {

			}).finally(function () {
				that._BusyDialog.close();
			});
        },
        preparePostBody: function() {
			var postDocs = [];
			var oTable = this.byId("idUploadTable");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return;
			}
			listItems.forEach(_getData,this); //根据选择的行获取具体的数据
			function _getData(sSelected, index) { //sSelected为选中的行
				var key = oTable.getContextByIndex(sSelected).getPath();
				var lineData = this._LocalData.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				postDocs.push(JSON.parse(JSON.stringify(lineData)));
			}
			return postDocs;
		},

		transformBack: function (data) {
			const result = [];
		
			// 遍历所有的 ReqDate 列，合并回原始形式
			Object.keys(data).forEach(key => {
				if (key.startsWith('ReqDate')) {
					const date = key.replace('ReqDate', ''); // 获取后面的日期
					if(Number(data[`ReqDate${date}`]) > 0) {
						result.push({
							Customer: data.Customer,
							Plant: data.Plant,
							Material: data.Material,
							RequirementDate: date,
							RequirementMonth: date.substring(0,6),
							RequirementQty: data[`ReqDate${date}`]
						});
					}
					
				}
			});
		
			return result;
		},

		getDates: function () {
			// 获取当前日期
			const currentDate = new Date();
		
			// 获取当前月份1号的日期
			const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
		
			// 获取当前月份+24个月的月底日期
			const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 24 + 1, 0);
		
			return {
				firstDayOfCurrentMonth: firstDayOfCurrentMonth.toISOString().slice(0, 10).replaceAll("-",""),
				lastDayOfFutureMonth: futureDate.toISOString().slice(0, 10).replaceAll("-","")
			};
		},

        onExport: function (oEvent) {
			var sId = oEvent.getSource().getParent().getParent().getId();
			// 根据id值获取table 
			var oTable = this.getView().byId(sId);
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
					var sProperty = aTableCol[i].getAggregation("template").getBindingPath("text");
					var sType = "string";
					// switch (sProperty) {
					// 	case "PrdStartDate":
					// 	case "PrdEndDate":
					// 	case "PostingDate":
					// 		sType = "Date";
					// 		break;
					// }
					var oExcelCol = {
						// 获取表格的列名，即设置excel的抬头
						label: sLabelText,
						// 数据类型，即设置excel该列的数据类型
						type: sType,
						// 获取数据的绑定路径，即设置excel该列的字段路径
						property: sProperty,
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
					hierarchyLevel: "level"
				},
				dataSource: aExcelSet, // 传入参数，数据源
				fileName: "Export_" + this._ResourceBundle.getText("title") + new Date().getTime() + ".xlsx" // 文件名，需要加上后缀
			};
			// 导出excel
			new Spreadsheet(oSettings).build();
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
            this._LocalData.setProperty("/isRecordCheckSuccessed", true);
        },
    });
});