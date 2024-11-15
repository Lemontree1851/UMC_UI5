sap.ui.define([
    "./BaseController",
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "../util/xlsx",
    "sap/m/BusyDialog"
], function (
    BaseController,
    Controller,
    formatter,
    messages,
    xlsx,
    BusyDialog
) {
    "use strict";

    return BaseController.extend("sd.zdndatebatchupdate.controller.Upload", {
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

        getMediaUrl: function (sUrlString) {
			if (sUrlString) {
				var sUrl = new URL(sUrlString);
				var iStart = sUrl.href.indexOf(sUrl.origin);
				var sPath = sUrl.href.substring(iStart + sUrl.origin.length, sUrl.href.length);
				//return "/S4" + sPath;
				return jQuery.sap.getModulePath("sd.zdndatebatchupdate") + sPath;
			} else {
				return "";
			}
		},

        onFileUploaderChange: function (oEvent) {
            this._BusyDialog.open();
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
            // var aHeadSet = [];
            // var aItemSet = [];
            // var dataKey;
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
                    dateNF: 'yyyymmdd;@'
                });
                // 获取sheet1单元格的内容
                var oSheet1 = oWB.Sheets[oWB.SheetNames[0]];
                // 将单元格的内容转换成数组的形式（自动将第一行作为抬头）
                var aSheet1 = XLSX.utils.sheet_to_row_object_array(oSheet1);
                // for循环每一行的内容添加到数据集当中,数据从第excel的3行开始（第一行默认为技术字段，不读取，第二行为说明行，JS中从0开始，所以从1开始读）
                var pritem = 0;
                
                for (var i = 1; i < aSheet1.length; i++) {
                    pritem ++;
                    
                    oItem = {
                        Status: "",
                        Message: "",
                        Row: i,
                        DeliveryDocument: aSheet1[i]["DeliveryDocument"] || "",
                        ShippingPoint: aSheet1[i]["ShippingPoint"] || "",
                        SalesOrganization: aSheet1[i]["SalesOrganization"] || "",
                        SalesOffice: aSheet1[i]["SalesOffice"] || "",
                        SoldToParty: aSheet1[i]["SoldToParty"] || "",
                        ShipToParty: aSheet1[i]["ShipToParty"] || "",
                        DocumentDate: aSheet1[i]["DocumentDate"] || "",
                        DeliveryDate: aSheet1[i]["DeliveryDate"] || "",
                        ActualGoodsMovementDate: aSheet1[i]["ActualGoodsMovementDate"] || "",
                        OverallGoodsMovementStatus: aSheet1[i]["OverallGoodsMovementStatus"] || "",
                        IntcoExtPlndTransfOfCtrlDteTme: aSheet1[i]["IntcoExtPlndTransfOfCtrlDteTme"] ? aSheet1[i]["IntcoExtPlndTransfOfCtrlDteTme"].toString().toUpperCase() : "" || "",
                        IntcoExtActlTransfOfCtrlDteTme: aSheet1[i]["IntcoExtActlTransfOfCtrlDteTme"] ? aSheet1[i]["IntcoExtActlTransfOfCtrlDteTme"].toString().toUpperCase() : "" || "",
                        IntcoIntPlndTransfOfCtrlDteTme: aSheet1[i]["IntcoIntPlndTransfOfCtrlDteTme"] ? aSheet1[i]["IntcoIntPlndTransfOfCtrlDteTme"].toString().toUpperCase() : "" || "",
                        IntcoIntActlTransfOfCtrlDteTme: aSheet1[i]["IntcoIntActlTransfOfCtrlDteTme"] ? aSheet1[i]["IntcoIntActlTransfOfCtrlDteTme"].toString().toUpperCase() : "" || "",
                        YY1_SalesDocType_DLH: aSheet1[i]["YY1_SalesDocType_DLH"] || "",
                    };
                    //因为有些数据读出来是数值类型，但odta要求字符类型，通过此种方式将所有值转换成字符类型
                    oItem = JSON.parse(JSON.stringify(oItem));
                    // //同时这种方式会将日期类型转换成ISO类型的字符，我们只截取日期部分
                    // oItem.IntcoExtPlndTransfOfCtrlDteTme = oItem.IntcoExtPlndTransfOfCtrlDteTme.slice(0,8);
                    // oItem.IntcoExtActlTransfOfCtrlDteTme = oItem.IntcoExtActlTransfOfCtrlDteTme.slice(0,8);
                    // oItem.IntcoIntPlndTransfOfCtrlDteTme = oItem.IntcoIntPlndTransfOfCtrlDteTme.slice(0,8);
                    // oItem.IntcoIntActlTransfOfCtrlDteTme = oItem.IntcoIntActlTransfOfCtrlDteTme.slice(0,8);
                    aExcelSet.push(oItem);
                }
                // this.checkDate(aExcelSet);
                this._LocalData.setProperty("/excelSet", aExcelSet)

                let postDocs = this.preparePostBatchBody();
                for (var i = 0; i < postDocs.length; i++) {
                    this.postAction("check", postDocs[i], i);
                }
            }.bind(this);
        },

        checkDate: function (aExcelSet) {   
            var regPos = /^\d+(\.\d+)?$/;     
            // 遍历数组
            for (let i = 0; i < aExcelSet.length; i++) {
                const obj = aExcelSet[i];
                aExcelSet[i].Status = "";
                aExcelSet[i].Message = "";

                if((!regPos.test(obj.IntcoExtActlTransfOfCtrlDteTme) || !regPos.test(obj.IntcoIntActlTransfOfCtrlDteTme) || obj.IntcoExtActlTransfOfCtrlDteTme.length !== 8 || obj.IntcoIntActlTransfOfCtrlDteTme.length !== 8)
                    && obj.IntcoExtActlTransfOfCtrlDteTme !== "NULL" && obj.IntcoIntActlTransfOfCtrlDteTme !== "NULL"){
                    if(obj.IntcoExtActlTransfOfCtrlDteTme.length !== 0 && obj.IntcoIntActlTransfOfCtrlDteTme.length !== 0){
                        aExcelSet[i].Status = "E";
                        aExcelSet[i].Message = this._ResourceBundle.getText("msgDate"); 
                    }
                }
            }
        },

        // onButtonCheckPress: function () {
        //     let postDocs = this.preparePostBody();
        //     let oModel = this._oDataModel,
        //         aDeferredGroups = oModel.getDeferredGroups();
        //     aDeferredGroups = aDeferredGroups.concat(["UploadHead0"]);
        //     oModel.setDeferredGroups(aDeferredGroups);
        //     for (var i = 0; i < postDocs.length; i++) {
		// 		this.postCreate(postDocs[i], i);
		// 	}
        //     oModel.submitChanges({ groupId: "UploadHead0" });
        // },

        onButtonPress: function (oEvent, sAction) {
            let postDocs = this.preparePostBatchBody();
            this._BusyDialog.open();
            for (var i = 0; i < postDocs.length; i++) {
				this.postAction(sAction, postDocs[i], i);
			}
            // var that = this;
            // var aExcelSet = this._LocalData.getProperty("/excelSet");
            // this._BusyDialog.open();
            // this.postAction("batchprocess", aExcelSet).then(records => {
            //     that._LocalData.setProperty("/excelSet", records)
            // }).finally(function () {
            //     that._BusyDialog.close();
            // });
        },
// 
        // preparePostBody: function () {
        //     let aExcelSet = this._LocalData.getProperty("/excelSet"),
		// 	    postDocs = [],
		// 	    postDoc,
		// 	    post = [];

		// 	aExcelSet.forEach(function (line) {
		// 		post.push(JSON.parse(JSON.stringify(line)));
		// 	}, this);

		// 	postDocs = post;
		// 	return postDocs;
        // },
        preparePostBatchBody: function () {
            let aExcelSet = this._LocalData.getProperty("/excelSet");
            this.checkDate(aExcelSet);
            let copyExcelSet = [];
            aExcelSet.forEach(item => {
                let postDoc = JSON.parse(JSON.stringify(item));
                if (postDoc.IntcoIntActlTransfOfCtrlDteTme == "NULL") {
                    postDoc.IntcoIntActlTransfOfCtrlDteTme = "1"
                }
                if (postDoc.IntcoExtActlTransfOfCtrlDteTme == "NULL") {
                    postDoc.IntcoExtActlTransfOfCtrlDteTme = "1"
                }
                copyExcelSet.push(postDoc);
            }, this)
            let postDocs = [JSON.stringify(copyExcelSet)];
            return postDocs;
        },
        // postCreate: function (postData, i) {
        //     delete postData.Type;
        //     delete postData.Message;
        //     let mParameters = {
        //         groupId: "UploadHead" + Math.floor(i / 100),
        //         // changeSetId: i,
        //         success: function (oData) {
        //             // var aExcelSet = this._LocalData.getProperty("/excelSet");
        //             // aExcelSet.forEach(function (line) {
        //             // 	line.Type = oData.Type;
        //             // 	line.Message = oData.Message;
        //             // });
        //         }.bind(this),
        //         error: function (oError) {
        //             // var aExcelSet = this._LocalData.getProperty("/excelSet");
        //             // aExcelSet.forEach(function (line) {
        //             // 	line.Type = "E";
        //             // 	line.Message = messages.parseErrors(oError,line.Datanumber);
        //             // });
        //         }.bind(this)
        //     };
        //     this.getOwnerComponent().getModel().create("/PurchaseReq", postData, mParameters);
        // },
    });
});