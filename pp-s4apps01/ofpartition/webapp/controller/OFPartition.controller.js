sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"../model/formatter",
	"./messages",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/ui/export/Spreadsheet",
	"sap/m/BusyDialog",
], function (
	Controller,
	formatter,
	messages,
	Filter,
	MessageBox,
	Spreadsheet,
	BusyDialog
) {
	"use strict";

	return Controller.extend("pp.ofpartition.controller.OFPartition", {
		formatter: formatter,
		onInit: function () {
			this._BusyDialog = new BusyDialog();
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
			this.dataFinished = true;
		},

		onSearch: function (oEvent) {
			this.errorPopup = false;
			var aFilter = this.getView().byId("idSmartFilterBar").getFilters();
			var oNewFilter, aNewFilter = [];

			// 获取分割范围
			var oDateRange = this.byId("idDateRangeSelection");
			if (oDateRange.getValue()) {
				var splitStart = `${oDateRange.getFrom().getFullYear()}${(oDateRange.getFrom().getMonth() + 1).toString().padStart(2, "0")}`;
				var splitEnd = `${oDateRange.getTo().getFullYear()}${(oDateRange.getTo().getMonth() + 1).toString().padStart(2, "0")}`;
				var splitRange = splitStart + "-" + splitEnd;
				aNewFilter.push(new Filter("SplitRange", "EQ", splitRange));
			}

			oNewFilter = new Filter({
				filters: aNewFilter,
				and: true
			});
			if (aNewFilter.length > 0) {
				aFilter.push(oNewFilter);
			}
			if (!aFilter) {
				aFilter = [];
			}
			// this.getFilter(aFilter)
			//中止之前的请求,防止上次正在请求的数据请求完成后错误的添加到此次请求中
			this.aHttpRequest.forEach(function (req) {
				req.abort();
			});

			this.getEntityCount(aFilter, splitRange).then(function (iItemCount) {
				if (iItemCount > 0) {
					//设置要查询的字段
					// let sParamtetrsOfSelect = "Customer,Plant,Material,MaterialByCustomer,MaterialName,RequirementDate,RequirementQty";
					let sParamtetrsOfSelect = "UUID,DataJson"; // MOD BY XINLEI XU 2025/02/27
					//获取数据
					this._LocalData.setProperty("/OFPartition", []);
					this._LocalData.setProperty("/OFPartitionTemp", []);
					this.getEntityContentOnePage(iItemCount, 0, aFilter, sParamtetrsOfSelect, splitRange);
				} else {
					this._LocalData.setProperty("/OFPartition", []);
					this.byId("idDynamicPage").setBusy(false);
				}
			}.bind(this));
		},

		getEntityCount: function (aFilter, splitRange) {
			var that = this;
			that.byId("idDynamicPage").setBusy(true);
			var promise = new Promise(function (resolve, reject) {
				var mParameters = {
					filters: aFilter,
					success: function (oData, response) {
						//如果后端统计条目数时不是使用的最终数据内表统计，那么这里的iItemCount并不一定准确，实际条目可能会少一些
						var iItemCount = Number(oData);
						resolve(iItemCount);
					},
					error: function (oError) {
						var iItemCount = 0;
						resolve(iItemCount);
						that.byId("idDynamicPage").setBusy(false);
						var sErrorMessage;
						try {
							var oJsonMessage = JSON.parse(oError.responseText);
							sErrorMessage = oJsonMessage.error.message.value;
						} catch (e) {
							sErrorMessage = oError.responseText;
						}
						MessageBox.error(sErrorMessage);
					}
				};
				// that.getOwnerComponent().getModel().read("/OFPartition(SplitRange='" + splitRange + "')/Set/$count", mParameters);
				that.getOwnerComponent().getModel().read("/OFPartition/$count", mParameters);
			});
			return promise;
		},

		getEntityContentOnePage: function (iTop, iSkip, aFilter, sParamtetrsOfSelect, splitRange) {
			sParamtetrsOfSelect = sParamtetrsOfSelect ? sParamtetrsOfSelect : "";
			var that = this;
			this.aHttpRequest = [];
			that.byId("idDynamicPage").setBusy(true);
			that.dataFinished = false;
			var aPromise = [];

			var aResult = that._LocalData.getProperty("/OFPartition");
			var aResultTemp = that._LocalData.getProperty("/OFPartitionTemp");
			var promise = new Promise(function (resolve, reject) {
				var mParameters = {
					filters: aFilter,
					urlParameters: {
						"$top": iTop,// iTop等于总数 超过5000条abap cloud会自动分页
						"$skiptoken": iSkip,
						"$select": sParamtetrsOfSelect
					},
					success: function (oData) {
						if (oData.results.length > 0) {
							// MOD BEGIN BY XINLEI XU 2025/02/27
							// aResultTemp.push.apply(aResultTemp, oData.results);
							oData.results.forEach(element => {
								aResultTemp.push.apply(aResultTemp, JSON.parse(element.DataJson));
							});
							// MOD END BY XINLEI XU 2025/02/27
							that._LocalData.setProperty("/OFPartitionTemp", aResultTemp);
						}
						resolve(oData);
					},
					error: function (oError) {
						//手动中止的导致的错误不需要处理
						if (!oError.aborted) {
							that.byId("idDynamicPage").setBusy(false);
							var sErrorMessage;
							try {
								var oJsonMessage = JSON.parse(oError.responseText);
								sErrorMessage = oJsonMessage.error.message.value;
							} catch (e) {
								sErrorMessage = oError.responseText;
							}
							sErrorMessage = sErrorMessage + that._ResourceBundle.getText("DataError");
							if (!that.errorPopup) {
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
				that.getOwnerComponent().getModel().setUseBatch(false);
				// that.aHttpRequest.push(that.getOwnerComponent().getModel().read("/OFPartition(SplitRange='" + splitRange + "')/Set", mParameters));
				that.aHttpRequest.push(that.getOwnerComponent().getModel().read("/OFPartition", mParameters));
			});
			promise.then(function (oData) {
				// 如果存在next参数，说明数据还未取完，需要再次取值
				if (oData.__next) {
					//abap cloud中odata每次最多只能取5000条，所以当还有数据时 iSkip加5000即可
					// 但这里会存在效率问题，虽然服务器强制分页，但是后端处理数据的逻辑中并没有考虑分页，那么相当于整个取值逻辑要重复执行好几次
					// 且需要前一页执行完毕之后才处理第二页
					iSkip = iSkip + 5000;
					that.getEntityContentOnePage(iTop, iSkip, aFilter, sParamtetrsOfSelect, splitRange);
					// 如果不存在next参数则说明数据已经取完
				} else {
					aResultTemp = that._LocalData.getProperty("/OFPartitionTemp");
					aResult = that.transformData(aResultTemp);
					that._LocalData.setProperty("/OFPartition", aResult);
					that.addColumns();

					that.aHttpRequest = [];
					that._LocalData.refresh();
					that.dataFinished = true;
					// that.byId("idDynamicPage").setBusy(false);
				}
			});
			// aPromise.push(promise);
		},

		onRowsUpdated: function () {
			if (this.dataFinished) {
				this.byId("idDynamicPage").setBusy(false);
			}
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
						MaterialByCustomer: item.MaterialByCustomer,
						MaterialName: item.MaterialName,
						ReqDates: {}
					};
				}

				// 将日期作为列名，使用RequirementQty填充
				// MOD BEGIN BY XINLEI XU 2025/02/27
				// let ReqDate = item.RequirementDate.getFullYear().toString();
				// ReqDate = ReqDate + (item.RequirementDate.getMonth() + 1).toString().padStart(2, "0")
				// ReqDate = ReqDate + item.RequirementDate.getDate().toString().padStart(2, "0")
				let ReqDate = item.RequirementDate.replace(/[^0-9]/g, '');
				// MOD END BY XINLEI XU 2025/02/27
				const dateKey = `ReqDate${ReqDate}`;
				result[key].ReqDates[dateKey] = item.RequirementQty;
			});

			// 将对象转化为数组形式，并将ReqDates展开为列
			return Object.values(result).map(item => {
				return {
					Customer: item.Customer,
					Plant: item.Plant,
					Material: item.Material,
					MaterialByCustomer: item.MaterialByCustomer,
					MaterialName: item.MaterialName,
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

		addColumn: function (sColName, oObj) {
			var sBindingPath = `{path:'local>${sColName}', type:'pp.ofpartition.controller.CustomDecimal'}`;
			// 生成input控件
			var oText = new sap.m.Input({
				value: sBindingPath
				// tooltip: "{local>" + sColName + "}" DEL BY XINLEI XU 2025/02/27
			});
			var sLabel = sColName.slice(7);
			var oCustomDataValue = { columnKey: sColName, leadingProperty: sColName };
			var sWidth = "8rem";
			var shAlign = "Begin";
			if (sColName.indexOf("ReqDate") >= 0) {
				shAlign = "End";
			}
			// 生成column id
			var sId = oObj.getView().createId(sColName);
			// 如果相同ID的column存在则删除(为了保证column的顺序，需要重新添加)
			if (oObj.byId(sId)) {
				oObj.byId(sId).destroyLabel();
				oObj.byId(sId).destroyTemplate();
				oObj.byId(sId).destroy(true);
			}
			// 往表中添加column
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
		onPositionColumn: function () {
			this.byId(this.getView().createId("ReqDate20241030")).focus();
		},

		onCreatePIR: function () {

			var aOFPartition = this._LocalData.getProperty("/OFPartition");
			var aSelectedItem = this.preparePostBody();
			var aPromise = [];
			var that = this;
			var processDate = this.getDates();
			aSelectedItem.forEach(function (line) {
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
					that.byId("idDynamicPage").setBusy(true);
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
						// 更新pir数据
						object._Item.forEach(function (line) {
							const date = line.RequirementDate;
							if (item) {
								item[`ReqDate${date}`] = line.RequirementQty;
							}
						});
						that._LocalData.setProperty("/OFPartition", aOFPartition);
						resolve(createPrintRecord);
					}).catch((oError) => {
						messages.showError(messages.parseErrors(oError));
						reject(oError);
					});
				});
				aPromise.push(promise);
			}.bind(this));

			Promise.all(aPromise).then(function () {

			}).finally(function () {
				that.byId("idDynamicPage").setBusy(false);
			});
		},

		preparePostBody: function () {
			var postDocs = [];
			var oTable = this.byId("reportTable1");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return;
			}
			listItems.forEach(_getData, this); //根据选择的行获取具体的数据
			function _getData(sSelected, index) { //sSelected为选中的行
				var key = oTable.getContextByIndex(sSelected).getPath();
				var lineData = this._LocalData.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				postDocs.push(JSON.parse(JSON.stringify(lineData)));
			}
			return postDocs;
		},

		transformBack: function (data) {
			const result = [];
			let isFisrtDate = true;
			// 遍历所有的 ReqDate 列，合并回原始形式
			Object.keys(data).forEach(key => {
				if (key.startsWith('ReqDate')) {
					const date = key.replace('ReqDate', ''); // 获取后面的日期
					// 本来只取数量大于0的数据，但特殊情况下，全部为0也要至少保证一条数据，所以使用isFisrtDate控制
					if (Number(data[`ReqDate${date}`]) > 0 || isFisrtDate) {
						isFisrtDate = false;
						result.push({
							Customer: data.Customer,
							Plant: data.Plant,
							Material: data.Material,
							RequirementDate: date,
							RequirementMonth: date.substring(0, 6),
							// MOD BEGIN BY XINLEI XU 2025/02/27
							// RequirementQty: data[`ReqDate${date}`]
							RequirementQty: data[`ReqDate${date}`].toString()
							// MOD END BY XINLEI XU 2025/02/27
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
				firstDayOfCurrentMonth: firstDayOfCurrentMonth.toISOString().slice(0, 10).replaceAll("-", ""),
				lastDayOfFutureMonth: futureDate.toISOString().slice(0, 10).replaceAll("-", "")
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
					// 对于Text控件需要获取text属性，对于Input控件需要获取value属性
					if (!sProperty) {
						sProperty = aTableCol[i].getAggregation("template").getBindingPath("value");
					}
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