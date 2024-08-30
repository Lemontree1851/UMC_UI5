/* global XLSX:true */
sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
], function (Base, formatter, xlsx, BusyDialog, MessageBox, Spreadsheet) {
    "use strict";

    return Base.extend("mm.purinforecordupload.controller.Main", {
        formatter: formatter,

        onInit: function () {
            this.getRouter().getRoute("Main").attachMatched(this._initialize, this);
        },

        _initialize: function () {
            this._BusyDialog = new BusyDialog();

        },

        onFileChange: function (oEvent) {
            var aExcelHeadSet = [];
            var aExcelItemSet = [];
            var oFile = oEvent.getParameter("files")[0];
            if (!oFile) {
                this.getModel("local").setProperty("/excelHeaderSet", []);
                this.getModel("local").setProperty("/excelItemSet", []);
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

                var oSheet1 = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[0]]; // head
                var oSheet2 = oWorkBook.Sheets[Object.getOwnPropertyNames(oWorkBook.Sheets)[1]]; // item
                var aSheetData1 = XLSX.utils.sheet_to_row_object_array(oSheet1);
                var aSheetData2 = XLSX.utils.sheet_to_row_object_array(oSheet2);
                // read valid data starting from line 3 - Head
                for (var i = 2; i < aSheetData1.length; i++) {
                    var item1 = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 1,
                        "PurchasingInfoRecord": aSheetData1[i]["PurchasingInfoRecord"],
                        "Supplier": aSheetData1[i]["Supplier"],
                        "Material": aSheetData1[i]["Material"],
                        "PurchasingOrganization": aSheetData1[i]["PurchasingOrganization"],
                        "Plant": aSheetData1[i]["Plant"],
                        "PurchasingInfoRecordCategory": aSheetData1[i]["PurchasingInfoRecordCategory"],
                        "SupplierMaterialNumber": aSheetData1[i]["SupplierMaterialNumber"],
                        "SupplierSubrange": aSheetData1[i]["SupplierSubrange"],
                        "SupplierMaterialGroup": aSheetData1[i]["SupplierMaterialGroup"],
                        "SupplierCertOriginCountry": aSheetData1[i]["SupplierCertOriginCountry"],
                        "SupplierCertOriginRegion": aSheetData1[i]["SupplierCertOriginRegion"],
                        "SuplrCertOriginClassfctnNumber": aSheetData1[i]["SuplrCertOriginClassfctnNumber"],
                        "PurgDocOrderQuantityUnit": aSheetData1[i]["PurgDocOrderQuantityUnit"],
                        "OrderItemQtyToBaseQtyDnmntr": aSheetData1[i]["OrderItemQtyToBaseQtyDnmntr"],
                        "OrderItemQtyToBaseQtyNmrtr": aSheetData1[i]["OrderItemQtyToBaseQtyNmrtr"],
                        "MaterialPlannedDeliveryDurn": aSheetData1[i]["MaterialPlannedDeliveryDurn"],
                        "StandardPurchaseOrderQuantity": aSheetData1[i]["StandardPurchaseOrderQuantity"],
                        "MinimumPurchaseOrderQuantity": aSheetData1[i]["MinimumPurchaseOrderQuantity"],
                        "ShippingInstruction": aSheetData1[i]["ShippingInstruction"],
                        "UnlimitedOverdeliveryIsAllowed": aSheetData1[i]["UnlimitedOverdeliveryIsAllowed"],
                        "InvoiceIsGoodsReceiptBased": aSheetData1[i]["InvoiceIsGoodsReceiptBased"],
                        "SupplierConfirmationControlKey": aSheetData1[i]["SupplierConfirmationControlKey"],
                        "TaxCode": aSheetData1[i]["TaxCode"],
                        "Currency": aSheetData1[i]["Currency"],
                        "NetPriceAmount": aSheetData1[i]["NetPriceAmount"],
                        "MaterialPriceUnitQty": aSheetData1[i]["MaterialPriceUnitQty"],
                        "PurchaseOrderPriceUnit": aSheetData1[i]["PurchaseOrderPriceUnit"],
                        "OrdPriceUnitToOrderUnitDnmntr": aSheetData1[i]["OrdPriceUnitToOrderUnitDnmntr"],
                        "OrderPriceUnitToOrderUnitNmrtr": aSheetData1[i]["OrderPriceUnitToOrderUnitNmrtr"],
                        "PricingDateControl": aSheetData1[i]["PricingDateControl"],
                        "IncotermsClassification": aSheetData1[i]["IncotermsClassification"],
                        "IncotermsLocation1": aSheetData1[i]["IncotermsLocation1"],
                        "IncotermsLocation2": aSheetData1[i]["IncotermsLocation2"],
                        "ConditionValidityStartDate": aSheetData1[i]["ConditionValidityStartDate"],
                        "PriceValidityEndDate": aSheetData1[i]["PriceValidityEndDate"],
                        "Xflag": aSheetData1[i]["ScaleOn"]

                    };
                    aExcelHeadSet.push(item1);
                };
                // read item
                for (var i = 2; i < aSheetData2.length; i++) {
                    var item2 = {
                        "Supplier": aSheetData2[i]["Supplier"],
                        "Material": aSheetData2[i]["Material"],
                        "PurchasingOrganization": aSheetData2[i]["PurchasingOrganization"],
                        "Plant": aSheetData2[i]["Plant"],
                        "PurchasingInfoRecordCategory": aSheetData2[i]["PurchasingInfoRecordCategory"],
                        "ConditionValidityStartDate": aSheetData2[i]["ConditionValidityStartDate"],
                        "ConditionValidityEndDate": aSheetData2[i]["ConditionValidityEndDate"],
                        "ConditionScaleQuantity": aSheetData2[i]["ConditionScaleQuantity"],
                        "ConditionScaleAmount": aSheetData2[i]["ConditionScaleAmount"]
                    };
                    aExcelItemSet.push(item2);
                }

                this._postData = this.getPostData(aExcelHeadSet, aExcelItemSet);
                this.getModel("local").setProperty("/excelHeadSet", aExcelHeadSet);
                this.getModel("local").setProperty("/excelItemSet", aExcelItemSet);
                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelHeadSet.length, 0, 0]));
                this.byId("idFileUploader").clear();
                this._BusyDialog.close();
            }.bind(this);
        },

        getPostData: function (aExcelHeadSet, aExcelItemSet) {
            var that = this;
            var aHeader = [];
            var aPostData = [];
            aExcelHeadSet.forEach(function (excelSet) {
                var oHeader = {};
                oHeader.SUPPLIER = excelSet.Supplier;
                oHeader.MATERIAL = excelSet.Material;
                oHeader.PURCHASINGORGANIZATION = excelSet.PurchasingOrganization;
                oHeader.PLANT = excelSet.Plant;
                oHeader.PURCHASINGINFORECORDCATEGORY = excelSet.PurchasingInfoRecordCategory;
                oHeader.SUPPLIERMATERIALNUMBER = excelSet.SupplierMaterialNumber;
                oHeader.SUPPLIERSUBRANGE = excelSet.SupplierSubrange;
                oHeader.SUPPLIERMATERIALGROUP = excelSet.SupplierMaterialGroup;
                oHeader.SUPPLIERCERTORIGINCOUNTRY = excelSet.SupplierCertOriginCountry;
                oHeader.SUPPLIERCERTORIGINREGION = excelSet.SupplierCertOriginRegion;
                oHeader.SUPLRCERTORIGINCLASSFCTNNUMBER = excelSet.SuplrCertOriginClassfctnNumber;
                oHeader.PURGDOCORDERQUANTITYUNIT = excelSet.PurgDocOrderQuantityUnit;
                oHeader.ORDERITEMQTYTOBASEQTYDNMNTR = excelSet.OrdPriceUnitToOrderUnitDnmntr;
                oHeader.ORDERPRICEUNITTOORDERUNITNMRTR = excelSet.OrderItemQtyToBaseQtyNmrtr;
                oHeader.MATERIALPLANNEDDELIVERYDURN = excelSet.MaterialPlannedDeliveryDurn;
                oHeader.STANDARDPURCHASEORDERQUANTITY = excelSet.StandardPurchaseOrderQuantity;
                oHeader.MINIMUMPURCHASEORDERQUANTITY = excelSet.MinimumPurchaseOrderQuantity;
                oHeader.SHIPPINGINSTRUCTION = excelSet.ShippingInstruction;
                oHeader.UNLIMITEDOVERDELIVERYISALLOWED = excelSet.UnlimitedOverdeliveryIsAllowed;
                oHeader.INVOICEISGOODSRECEIPTBASED = excelSet.InvoiceIsGoodsReceiptBased;
                oHeader.SUPPLIERCONFIRMATIONCONTROLKEY = excelSet.SupplierConfirmationControlKey;
                oHeader.TAXCODE = excelSet.TaxCode;
                oHeader.CURRENCY = excelSet.Currency;
                oHeader.NETPRICEAMOUNT = excelSet.NetPriceAmount;
                oHeader.MATERIALPRICEUNITQTY = excelSet.MaterialPriceUnitQty;
                oHeader.PURCHASEORDERPRICEUNIT = excelSet.PurchaseOrderPriceUnit;
                oHeader.ORDPRICEUNITTOORDERUNITDNMNTR = excelSet.OrdPriceUnitToOrderUnitDnmntr;
                oHeader.ORDERPRICEUNITTOORDERUNITNMRTR = excelSet.OrderPriceUnitToOrderUnitNmrtr;
                oHeader.PRICINGDATECONTROL = excelSet.PricingDateControl;
                oHeader.INCOTERMSCLASSIFICATION = excelSet.IncotermsClassification;
                oHeader.INCOTERMSLOCATION1 = excelSet.IncotermsLocation1;
                oHeader.INCOTERMSLOCATION2 = excelSet.IncotermsLocation2;
                oHeader.CONDITIONVALIDITYSTARTDATE = formatter.odataDate(excelSet.ConditionValidityStartDate);
                oHeader.PRICEVALIDITYENDDATE = formatter.odataDate(excelSet.PriceValidityEndDate);
                oHeader.XFLAG = excelSet.Xflag;
                oHeader.ROW = excelSet.Row;

                aHeader.push(oHeader);
            });

            aHeader.forEach(function (head, index) {
                head.to_item = [];

                aExcelItemSet.forEach(function (item) {
                    if (item.Supplier === head.SUPPLIER && item.Material === head.MATERIAL
                        && item.Plant === head.PLANT && item.PurchasingOrganization === head.PURCHASINGORGANIZATION
                        && item.PurchasingInfoRecordCategory === head.PURCHASINGINFORECORDCATEGORY) {
                        var pushItem = {};
                        pushItem.SUPPLIER = item.Supplier;
                        pushItem.MATERIAL = item.Material;
                        pushItem.PURCHASINGORGANIZATION = item.PurchasingOrganization;
                        pushItem.PLANT = item.Plant;
                        pushItem.PURCHASINGINFORECORDCATEGORY = item.PurchasingInfoRecordCategory;
                        pushItem.CONDITIONVALIDITYSTARTDATE = formatter.odataDate(item.ConditionValidityStartDate);
                        pushItem.CONDITIONVALIDITYENDDATE = formatter.odataDate(item.ConditionValidityEndDate);
                        pushItem.CONDITIONSCALEQUANTITY = item.ConditionScaleQuantity;
                        pushItem.CONDITIONSCALEAMOUNT = item.ConditionScaleAmount;

                        head.to_item.push(pushItem);
                    };
                });

                aPostData.push(head);
            });

            return aPostData;
        },

        onClear: function () {
            this.getModel("local").setProperty("/excelHeadSet", []);
            this.getModel("local").setProperty("/excelItemSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },

        onExcute: function () {
            this._callOData("EXCUTE");
        },

        _callOData: function (bEvent) {
            var aPromise = [];
            var aGroupKey = this.removeDuplicates(this._postData, ["SUPPLIER", "MATERIAL", "PUCHASINGORGANIZATION", "PLANT"]);
            var aGroupItems;

            for (var m = 0; m < aGroupKey.length; m++) {
                const sSupplier = aGroupKey[m].SUPPLIER;
                const sMaterial = aGroupKey[m].MATERIAL;
                const sPurchasingOrganization = aGroupKey[m].PURCHASINGORGANIZATION;
                const sPlant = aGroupKey[m].PLANT;
                aGroupItems = [];
                for (var n = 0; n < this._postData.length; n++) {
                    if (this._postData[n].SUPPLIER === sSupplier && this._postData[n].MATERIAL === sMaterial
                        && this._postData[n].PLANT === sPlant && this._postData[n].PURCHASINGORGANIZATION === sPurchasingOrganization) {
                        aGroupItems.push(this._postData[n]);
                    }
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems));
            };

            try {
                this._BusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                    var oResult = {
                        iSuccess: 0,
                        iFailed: 0
                    };
                    this._BusyDialog.close();
                    var aExcelSet = this.getModel("local").getProperty("/excelHeadSet");
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
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
                    }
                    this.getModel("local").setProperty("/excelHeadSet", aExcelSet);
                    this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
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
                var uploadProcess = this.getModel().bindContext("/PurInfoRecordHeader/com.sap.gateway.srvd.zui_purinforecord_o4.v0001.processLogic(...)");
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
