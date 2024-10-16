sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/ui/export/Spreadsheet"
], function(
    Controller,
    formatter,
    messages,
	Filter,
	MessageBox,
	Spreadsheet
) {
	"use strict";

	return Controller.extend("pp.ofpartition.controller.OFPartition", {
        formatter : formatter,
        onInit: function () {
            // this._BusyDialog = new BusyDialog();
            this._LocalData = this.getOwnerComponent().getModel("local");
            this._oDataModel = this.getOwnerComponent().getModel();
            this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            // this._oDataModel.attachRequestCompleted(function (oEvent) {
			// 	try {
			// 		var oResponse, aResults;
			// 		if (oEvent.getParameter("method") === "GET" && oEvent.getParameter("response").statusCode === "200" &&
			// 			oEvent.getParameter("url").split("?")[0] === "OFPartition") {
						
			// 			oResponse = oEvent.getParameter("response");
			// 			aResults = JSON.parse(oResponse.responseText).d.results;
			// 			// this.fillOFPartition(this.allPostResults,aResults);
			// 		}
			// 	} catch (e) {}
			// }.bind(this));

            this.aHttpRequest = [];
        },

        onSearch: function (oEvent) {
            this.errorPopup = false;
			var aFilter = this.getView().byId("idSmartFilterBar").getFilters();
			if (!aFilter) {
				aFilter = [];
			}
			// this.getFilter(aFilter)
				//中止之前的请求,防止上次正在请求的数据请求完成后错误的添加到此次请求中
			this.aHttpRequest.forEach(function (req) {
				req.abort();
			});
            var sParamtetrsOfSelect = "Customer,Plant,Material,RequirementDate,RequirementQty";
			//获取数据
            this._LocalData.setProperty("/OFPartition", []);
            this.getEntityContent(aFilter, sParamtetrsOfSelect);
        },

        getEntityContent: function (aFilter, sParamtetrsOfSelect) {
			sParamtetrsOfSelect = sParamtetrsOfSelect ? sParamtetrsOfSelect : "";
			var that = this;
			this.aHttpRequest = [];
			that.byId("reportTable1").setBusy(true);
			var aPromise = [];

			// 获取分割范围
			var oDateRange = that.byId("idDateRangeSelection");
			var splitStart = `${oDateRange.getFrom().getFullYear()}${(oDateRange.getFrom().getMonth() + 1).toString().padStart(2,"0")}`;
			var splitEnd = `${oDateRange.getTo().getFullYear()}${(oDateRange.getTo().getMonth() + 1).toString().padStart(2,"0")}`;
			var splitRange = splitStart + "-" + splitEnd;
			var aResult = that._LocalData.getProperty("/OFPartition");
			var promise = new Promise(function (resolve, reject) {
				var mParameters = {
					filters: aFilter,
					urlParameters: {
						// "$top": iTop,
						// "$skip": iSkip,
						"$select": sParamtetrsOfSelect
					},
					success: function (oData) {
						if (oData.results.length > 0) {
							// let sTitle = that._ResourceBundle.getText("tableHeaderTitle");
							// let resultCount = aResult.push.apply(aResult, oData.results);
							// that._LocalData.setProperty("/OFPartition", aResult);
							// sTitle = sTitle + "(" + resultCount + ")";
							// that.byId("idReportTableTitle").setText(sTitle);
                            aResult = that.transformData(oData.results);
							that._LocalData.setProperty("/OFPartition", aResult);
							that.addColumns();
						} 
						resolve();
					},
					error: function (oError) {
						//手动中止的导致的错误不需要处理
						if (!oError.aborted) {
							// let sTitle = that._ResourceBundle.getText("tableHeaderTitle");
							// that.byId("idReportTableTitle").setText(sTitle);
							that.byId("reportTable1").setBusy(false);
							var sErrorMessage;
							try {
								var oJsonMessage = JSON.parse(oError.responseText);
								sErrorMessage = oJsonMessage.error.message.value;
							} catch (e) {
								sErrorMessage = oError.responseText;
							}
							sErrorMessage = sErrorMessage + that._ResourceBundle.getText("DataError");
							if(!that.errorPopup) {
								MessageBox.error(sErrorMessage);
								that.errorPopup = true;
								that._LocalData.setProperty("/OFPartition", []);
							}
							that.aHttpRequest.forEach(function (req) {
								req.abort();
							});
							reject();
						}
					}
				};
				// that.getOwnerComponent().getModel().setHeaders({"splitStart":splitStart, "splitEnd":splitEnd});
				that.getOwnerComponent().getModel().setUseBatch(false);
				that.aHttpRequest.push(that.getOwnerComponent().getModel().read("/OFPartition(SplitRange='" + splitRange + "')/Set", mParameters));
			});
			//最后一次取值成功处理
            promise.then(function () {
                that.byId("reportTable1").setBusy(false);
                that.aHttpRequest = [];
                that._LocalData.refresh();
            });
			// aPromise.push(promise);
		},

        transformData: function (data) {
            // 创建一个对象来存储转换后的数据
            let result = {};
        
            // 遍历数据数组
            data.forEach(item => {
                // 使用Customer, Plant, Material作为key值组合
                const key = `${item.Customer}_${item.Plant}_${item.Material}`;
        
                // 如果当前组合的key不存在于result中，则初始化它
                if (!result[key]) {
                    result[key] = {
						// Type: item.Type,
						// Message: item.Message,
                        Customer: item.Customer,
                        Plant: item.Plant,
                        Material: item.Material,
						MaterialByCustomer: item.Material,
						MaterialName: item.MaterialName,
                        ReqDates: {}
                    };
                }
        
                // 将日期作为列名，使用RequirementQty填充
				let ReqDate = item.RequirementDate.getFullYear().toString();
				ReqDate = ReqDate + (item.RequirementDate.getMonth() + 1).toString().padStart(2,"0")
				ReqDate = ReqDate + item.RequirementDate.getDate().toString().padStart(2,"0")
                const dateKey = `ReqDate${ReqDate}`;
                result[key].ReqDates[dateKey] = item.RequirementQty;
            });
        
            // 将对象转化为数组形式，并将ReqDates展开为列
            return Object.values(result).map(item => {
                return {
                    Customer: item.Customer,
                    Plant: item.Plant,
                    Material: item.Material,
                    ...item.ReqDates // 展开动态生成的日期列
                };
            });
        },

		addColumns: function () {
			var ofpartition = this._LocalData.getProperty("/OFPartition");
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
			var oText = new sap.m.Input({
							value : "{local>" + sColName + "}",
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
			oObj.getView().byId("reportTable1").addColumn(oColumn);
		},
		onPositionColumn:function() {
			this.byId(this.getView().createId("ReqDate20241030")).focus();
		},

		onCreatePIR: function () {
			var aOFPartition = this._LocalData.getProperty("/OFPartition");
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
						that._LocalData.setProperty("/OFPartition", aOFPartition);
					}).catch((oError) => {
						console.log(oError.error);
						reject(oError);
					});
				});
				aPromise.push(promise);
			}.bind(this));

			Promise.all(aPromise).then(function () {

			});
		},
		  
		preparePostBody: function() {
			var postDocs = [];
			var oTable = this.byId("reportTable1");
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

	});
});