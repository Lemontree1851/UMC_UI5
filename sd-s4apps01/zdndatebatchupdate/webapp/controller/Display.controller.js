sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "./messages",
	"sap/ui/model/Filter",
	"sap/m/BusyDialog",
    "sap/ui/export/Spreadsheet"
], function(
    BaseController,
    formatter,
    messages,
	Filter,
	BusyDialog,
	Spreadsheet
) {
	"use strict";

	return BaseController.extend("sd.zdndatebatchupdate.controller.Display", {
        formatter : formatter,
        onInit: function () {
			this._LocalData = this.getOwnerComponent().getModel("local");
			this._oDataModel = this.getOwnerComponent().getModel();
			this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this._BusyDialog = new BusyDialog();
			this._LocalData.setProperty("/onExportvisible",false)
            var oRouter = this.getRouter();
			oRouter.getRoute("RouteMain").attachMatched(this._onRouteMatched, this);
        },
        // onRowActionItemPress : function(oEvent){
		// 	var oItem, oCtx;

		// 	oItem = oEvent.getSource();
		// 	oCtx = oItem.getBindingContext();

		// 	this.getRouter().navTo("PurchaseReq",{
		// 		contextPath : oCtx.getProperty("UUID")
		// 	});
		// },
        _onRouteMatched : function (oEvent) {
            this.getView().getModel().resetChanges();
			// var oArgs, oView;

			// oArgs = oEvent.getParameter("arguments");
			// oView = this.getView();

			// oView.bindElement({
			// 	path : "/PurchaseReq(guid'" + oArgs.contextPath + "')",
			// 	events : {
			// 		change: this._onBindingChange.bind(this),
			// 		dataRequested: function (oEvent) {
			// 			oView.setBusy(true);
			// 		},
			// 		dataReceived: function (oEvent) {
			// 			oView.setBusy(false);
			// 		}
			// 	}
			// });
			// this.byId("idSmartForm").setEditable(false);
			// this.byId("idPage").setShowFooter(false);
		},

		onBeforeRebindTable: function (oEvent) {
			// this._oDataModel.resetChanges();
			// var oFilter = oEvent.getParameter("bindingParams").filters;
			// var oNewFilter, aNewFilter = [];
			// var oCreatedAt = this.byId("idDatePicker").getDateValue();
			// if (oCreatedAt) {
			// 	aNewFilter.push(new Filter("CreatedAt", "EQ", formatter.convertLocalDateToUTCDate(oCreatedAt))); 
			// }
			
			// oNewFilter = new Filter({
			// 	filters:aNewFilter,
			// 	and:true
			// });
			// if (aNewFilter.length > 0) {
			// 	oFilter.push(oNewFilter);
			// }
		},

		onUITableRowsUpdated: function (oEvent) {
			var oTablecon = this.getView().byId("idDeliveryDocumentTable").getBinding().getContexts();
			var tDeliveryDocument = [];
			if(oTablecon){
				// tDeliveryDocument.push(oTablecon[0].getObject());
				oTablecon.forEach(function (cont) {
					var vData = tDeliveryDocument.filter(tDeliveryDocument => tDeliveryDocument.DeliveryDocument===cont.getObject().DeliveryDocument)
					if(vData.length == 0){
						tDeliveryDocument.push(cont.getObject());
					}
				}, this);
			}
			var iHeader = 0;
			var iItems = 0;
			iHeader = tDeliveryDocument.length;
			iItems = oTablecon.length;


            var sDisInfo = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("disInfo", [iHeader, iItems]);
            // this._LocalData.setProperty("/disInfo", sDisInfo);
			if(iHeader > 0){
				this._LocalData.setProperty("/disInfo", sDisInfo);
				this._LocalData.setProperty("/onExportvisible",true)
			}else{
				this._LocalData.setProperty("/disInfo", "");
				this._LocalData.setProperty("/onExportvisible",false)
			}
		},

		createPurchseOrder: function (oEvent) {
			var aSelectedItems = this.preparePostBody();
			if (aSelectedItems.length === 0) {
				return;
			}
			this.postAction("createPurchaseOrder", JSON.stringify(aSelectedItems));

		},

		removeDuplicates: function(arr) {
			const map = new Map();
			arr.forEach(item => map.set(item.PrNo, item));
			return Array.from(map.values());
		},
		// postAction: function (sAction, postData) {
		// 	this._BusyDialog.open();
        //     var oModel = this._oDataModel;
        //     oModel.callFunction(`/${sAction}`, {
        //         method: "POST",
        //         // groupId: "myId",//如果设置groupid，会多条一起进入action
        //         changeSetId: 1,
        //         //建议只传输前端修改的参数，其他字段从后端获取
        //         urlParameters: {
        //             Event: sAction,
        //             Zzkey: postData
        //         },
        //         success: function (oData) {
		// 			var aDataKey = Object.getOwnPropertyNames(this._oDataModel.getProperty("/"));
		// 			for (var i = aDataKey.length - 1; i >= 0; i--) {
		// 				if (aDataKey[i].slice(0,11) !== "PurchaseReq") {
		// 					aDataKey.splice(i, 1);
		// 				}
		// 			}
        //             let result = JSON.parse(oData[sAction].Zzkey);
        //             result.forEach(function (line) {
        //                 aDataKey.forEach(function(key, index){
		// 					var lineData = this._oDataModel.getProperty("/" + key);
		// 					if (lineData.UUID.replace(/-/g, '') === this.base64ToHex(line.UUID)) {
		// 						// lineCount++;
		// 						this._oDataModel.setProperty("/" + key + "/Type", line.TYPE);
		// 						this._oDataModel.setProperty("/" + key + "/Message", line.MESSAGE);
		// 						this._oDataModel.setProperty("/" + key + "/PurchaseOrder", line.PURCHASEORDER);
		// 						this._oDataModel.setProperty("/" + key + "/PurchaseOrderItem", line.PURCHASEORDERITEM);
		// 					}
		// 				},this);
        //             },this);
		// 			this._BusyDialog.close();
        //         }.bind(this),
        //         error: function (oError) {
        //             this._LocalData.setProperty("/recordCheckSuccessed", false);
        //             messages.showError(messages.parseErrors(oError));
		// 			this._BusyDialog.close();
        //         }.bind(this)
        //     });
        //     // oModel.submitChanges({ groupId: "myId" });
        // },

		base64ToHex: function (base64) {
			const raw = atob(base64);  // Decode the base64 string
			let result = '';
			for (let i = 0; i < raw.length; i++) {
				const hex = raw.charCodeAt(i).toString(16).padStart(2, '0');
				result += hex;
			}
			return result.toLowerCase();
		},
		preparePostBody:function () {
			var aData = [];
			var postDocs = [];
			// 根据id值获取table 
			var oTable = this.getView().byId("idDeliveryDocumentTable");
			var listItems = oTable.getSelectedIndices();
			if (listItems.length === 0) {
				messages.showError(this._ResourceBundle.getText("msgNoSelect"));
				return aData;
			}
			listItems.forEach(_getData,this); //根据选择的行获取具体的数据
			function _getData(iSelected, index) { //sSelected为选中的行
				let key = oTable.getContextByIndex(iSelected).getPath();
				let lineData = this._oDataModel.getProperty(key); //根据选中的行获取到ODATA键值，然后再获取到具体属性值
				let postData = JSON.parse(JSON.stringify(lineData));
				aData.push(postData);
			}
			return aData;
		},
        onExport: function () {
			// 根据id值获取table 
			var oTable = this.getView().byId("idDeliveryDocumentTable");

			var aExcelSet = this.preparePostBody();

			if (aExcelSet.length === 0) {
				return;
			}
			this._BusyDialog.open();
			this.postAction("export", JSON.stringify(aExcelSet),1);
			this._BusyDialog.close();
			// var aExcelCol = [];
            // // 获取table的columns
            // var aTableCol = oTable.getColumns();
			// for (var i = 1; i < aTableCol.length; i++) {
			// 	if (aTableCol[i].getVisible()) {
			// 		var sLabelText = aTableCol[i].getAggregation("label").getText();
			// 		var sTemplatePath = aTableCol[i].getAggregation("template").getBindingPath("text");
			// 		var oExcelCol = {
			// 			// 获取表格的列名，即设置excel的抬头
			// 			label: sLabelText,
			// 			// 数据类型，即设置excel该列的数据类型
			// 			type: "string",
					
			// 			// 获取数据的绑定路径，即设置excel该列的字段路径
			// 			property: sTemplatePath,
			// 			// 获取表格的width属性，即设置excel该列的长度
			// 			width: parseFloat(aTableCol[i].getWidth())
			// 		};
			// 		aExcelCol.push(oExcelCol);
			// 	}
			// }
			// // 设置excel的相关属性
			// var oSettings = {
			// 	workbook: {
			// 		columns: aExcelCol,
			// 		context: {
			// 			version: "1.54",
			// 			hierarchyLevel: "level"
			// 		}
			// 	},
			// 	dataSource: aExcelSet, 
			// 	fileName: "Export_" + this._ResourceBundle.getText("title") + new Date().getTime() + ".xlsx" // 文件名，需要加上后缀
            // };
			
			// // 导出excel
			// new Spreadsheet(oSettings).build();
        }

	});
});