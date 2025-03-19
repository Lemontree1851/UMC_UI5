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

                this._UserInfo = sap.ushell.Container.getService("UserInfo");
                var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
                var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
                var oContextBinding = this.getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
                    "$expand": "_AssignPlant,_AssignCompany,_AssignSalesOrg,_AssignPurchOrg,_AssignRole($expand=_UserRoleAccessBtn)"
                });
                oContextBinding.requestObject().then(function (context) {
                    var aAccessBtns = [],
                        aAllAccessBtns = [];
                    if (context._AssignRole && context._AssignRole.length > 0) {
                        context._AssignRole.forEach(role => {
                            aAccessBtns.push(role._UserRoleAccessBtn);
                        });
                        aAllAccessBtns = aAccessBtns.flat();
                    }
                    if (!aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-View")) {
                        if (!this.oErrorMessageDialog) {
                            this.oErrorMessageDialog = new sap.m.Dialog({
                                type: sap.m.DialogType.Message,
                                state: "Error",
                                content: new sap.m.Text({
                                    text: this.getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                                })
                            });
                        }
                        this.oErrorMessageDialog.open();
                    }
                    this.getModel("local").setProperty("/authorityCheck", {
                        button: {
                            View: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-View"),
                            Clear: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Clear"),
                            Check: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Check"),
                            Create: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Create"),
                            Overwrite: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Overwrite"),
                            Delete: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Delete"),
                            Add: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Add"),
                            Export: aAllAccessBtns.some(btn => btn.AccessId === "salesacceptance-Export")
                        },
                        data: {
                            PlantSet: context._AssignPlant,
                            CompanySet: context._AssignCompany,
                            SalesOrgSet: context._AssignSalesOrg,
                            PurchOrgSet: context._AssignPurchOrg,
                            RoleSet: context._AssignRole
                        }
                    });
                }.bind(this), function (oError) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: this.getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }.bind(this));

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
                    var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail(); // ADD BY XINLEI XU 2025/03/19
                    // read valid data starting from line 3 
                    for (var i = 1; i < aSheetData.length; i++) {
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i,
                            "SalesOrganization": aSheetData[i]["SalesOrganization"],
                            "Customer": aSheetData[i]["Customer"],
                            "PeriodType": aSheetData[i]["PeriodType"],
                            "AcceptPeriod": aSheetData[i]["AcceptPeriod"],
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
                            "OutsideData": aSheetData[i]["OutsideData"],
                            "AcceptPeriodFrom": aSheetData[i]["AcceptPeriodFrom"],
                            "AcceptPeriodTo": aSheetData[i]["AcceptPeriodTo"],
                            "FinishStatus": "",
                            "UserEmail": sEmail // ADD BY XINLEI XU 2025/03/19
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
                var aPromise = [];
                var aExcelSet = this.getModel("local").getProperty("/excelSet");
                var aGroupItems;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    aExcelSet[n].ReceiptDate = formatter.odataDate(aExcelSet[n].ReceiptDate);
                    aExcelSet[n].AcceptDate = formatter.odataDate(aExcelSet[n].AcceptDate);
                    aExcelSet[n].AcceptPeriodFrom = formatter.odataDate(aExcelSet[n].AcceptPeriodFrom);
                    aExcelSet[n].AcceptPeriodTo = formatter.odataDate(aExcelSet[n].AcceptPeriodTo);
                    aGroupItems.push(aExcelSet[n]);
                }
                aPromise.push(this._callODataAction(bEvent, aGroupItems));

                try {
                    this._BusyDialog.open();
                    Promise.all(aPromise).then((aContext) => {
                        var oResult = {
                            iSuccess: 0,
                            iFailed: 0
                        };
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
                                this._BusyDialog.close();
                            } else {
                                JSON.parse(object.Zzkey).forEach(element => {
                                    for (var index = 0; index < aExcelSet.length; index++) {
                                        if (aExcelSet[index].Row === element.ROW) {
                                            aExcelSet[index].Status = element.STATUS;
                                            aExcelSet[index].Message = element.MESSAGE;
                                        }
                                    }
                                });
                                this.getModel("local").setProperty("/excelSet", aExcelSet);
                                this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                                this._BusyDialog.close();
                            }
                        }
                    }).catch((error) => {
                        MessageBox.error(error.message);
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
                    var uploadProcess = this.getModel().bindContext("/SalesAcceptance/com.sap.gateway.srvd.zui_salesacceptance_o4.v0001.processLogic(...)");
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
                var oTable = this.getView().byId("tableSalesAcceptance");
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
