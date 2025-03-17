/* global XLSX:true */
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

        return Base.extend("mm.sourcelistupload.controller.Main", {
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
                    if (!aAllAccessBtns.some(btn => btn.AccessId === "sourcelistupload-View")) {
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
                            View: aAllAccessBtns.some(btn => btn.AccessId === "sourcelistupload-View"),
                            Clear: aAllAccessBtns.some(btn => btn.AccessId === "sourcelistupload-Clear"),
                            Excute: aAllAccessBtns.some(btn => btn.AccessId === "sourcelistupload-Excute"),
                            Export: aAllAccessBtns.some(btn => btn.AccessId === "sourcelistupload-Export")
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
                    var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail(); // ADD BY XINLEI XU 2025/03/17
                    // read valid data starting from line 4 
                    for (var i = 4; i < aSheetData.length; i++) {
                        var item = {
                            "Status": "",
                            "Message": "",
                            "Row": i - 3,
                            "Material": aSheetData[i]["Material"],
                            "Plant": aSheetData[i]["Plant"],
                            "SourceListRecord": aSheetData[i]["SourceListRecord"],
                            "ValidityStartDate": aSheetData[i]["ValidityStartDate"],
                            "ValidityEndDate": aSheetData[i]["ValidityEndDate"],
                            "Supplier": aSheetData[i]["Supplier"],
                            "PurchasingOrganization": aSheetData[i]["PurchasingOrganization"],
                            "SupplierIsFixed": aSheetData[i]["SupplierIsFixed"],
                            "SourceOfSupplyIsBlocked": aSheetData[i]["SourceOfSupplyIsBlocked"],
                            "MrpSourcingControl": aSheetData[i]["MrpSourcingControl"],
                            "Xflag": aSheetData[i]["Usage"],
                            "UserEmail": sEmail // ADD BY XINLEI XU 2025/03/17

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

            onExcute: function () {
                this._callOData("EXCUTE");
            },

            _callOData: function (bEvent) {

                var aExcelSet = this.getModel("local").getProperty("/excelSet");
                var aGroupKey = this.removeDuplicates(aExcelSet, ["Material", "Plant"]);
                //var aGroupItems;
                var aPromise = [];

                this._BusyDialog.open();
                this.processOneBatchRequest(bEvent, 0, aExcelSet, aGroupKey, aPromise);

                // for (var m = 0; m < aGroupKey.length; m++) {
                //     const sMaterial = aGroupKey[m].Material;
                //     const sPlant = aGroupKey[m].Plant;
                //     aGroupItems = [];
                //     for (var n = 0; n < aExcelSet.length; n++) {
                //         if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant) {
                //             aExcelSet[n].ValidityStartDate = formatter.odataDate(aExcelSet[n].ValidityStartDate);
                //             aExcelSet[n].ValidityEndDate = formatter.odataDate(aExcelSet[n].ValidityEndDate);
                //             aGroupItems.push(aExcelSet[n]);
                //         }
                //     }
                //     aPromise.push(this._callODataAction(bEvent, aGroupItems));
                // };



                // try {
                //     this._BusyDialog.open();
                //     Promise.all(aPromise).then((aContext) => {
                //         var oResult = {
                //             iSuccess: 0,
                //             iFailed: 0
                //         };
                //         this._BusyDialog.close();
                //         var aExcelSet = this.getModel("local").getProperty("/excelSet");
                //         for (const activeContext of aContext) {
                //             var boundContext = activeContext.getBoundContext();
                //             var object = boundContext.getObject();
                //             JSON.parse(object.Zzkey).forEach(element => {
                //                 for (var index = 0; index < aExcelSet.length; index++) {
                //                     if (aExcelSet[index].Row === element.ROW) {
                //                         aExcelSet[index].Status = element.STATUS;
                //                         aExcelSet[index].Message = element.MESSAGE;

                //                         if (element.STATUS = 'S') {
                //                             oResult.iSuccess += 1;
                //                         } else {
                //                             oResult.iFailed += 1;
                //                         }
                //                     }
                //                 }
                //             });
                //         }
                //         this.getModel("local").setProperty("/excelSet", aExcelSet);
                //         this.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                //     }).catch((error) => {
                //         MessageBox.error(error);
                //     }).finally(() => {
                //         this._BusyDialog.close();
                //     });
                // } catch (error) {
                //     MessageBox.error(error);
                //     this._BusyDialog.close();
                // }
            },

            processOneBatchRequest: function (bEvent, batchOfCount, postDocs, postKeys, postArray) {
                let that = this;
                let batchArray = [];
                let iItemCount = postKeys.length;
                let iPerCount = 100;
                let iDoCount = Math.ceil(iItemCount / iPerCount);
                let iBegin = batchOfCount * iPerCount;
                let iEnd = 0;
                let aGroupItems;
                if (batchOfCount === iDoCount - 1) {
                    iEnd = iBegin + (iItemCount - iBegin);
                } else {
                    iEnd = iBegin + iPerCount;
                }
                for (let j = iBegin; j < iEnd; j++) {
                    const sMaterial = postKeys[j].Material;
                    const sPlant = postKeys[j].Plant;
                    aGroupItems = [];
                    for (var n = 0; n < postDocs.length; n++) {
                        if (postDocs[n].Material === sMaterial && postDocs[n].Plant === sPlant) {
                            postDocs[n].ValidityStartDate = formatter.odataDate(postDocs[n].ValidityStartDate);
                            postDocs[n].ValidityEndDate = formatter.odataDate(postDocs[n].ValidityEndDate);
                            aGroupItems.push(postDocs[n]);
                        }
                    }
                    batchArray.push(that._callODataAction(bEvent, aGroupItems));
                };
                postArray = postArray.concat(batchArray);
                batchOfCount++;
                if (batchOfCount < iDoCount) {
                    Promise.all(batchArray).finally(function () {
                        that.processOneBatchRequest(bEvent, batchOfCount, postDocs, postKeys, postArray);
                    });
                } else {
                    that.processMessage(postArray);
                };
            },

            processMessage: function (aPromise) {
                let that = this;
                try {
                    Promise.all(aPromise).then((aContext) => {
                        var oResult = {
                            iSuccess: 0,
                            iFailed: 0
                        };
                        that._BusyDialog.close();
                        var aExcelSet = that.getModel("local").getProperty("/excelSet");
                        for (const activeContext of aContext) {
                            var boundContext = activeContext.getBoundContext();
                            var object = boundContext.getObject();
                            JSON.parse(object.Zzkey).forEach(element => {
                                for (var index = 0; index < aExcelSet.length; index++) {
                                    if (aExcelSet[index].Row === element.ROW) {
                                        aExcelSet[index].Status = element.STATUS;
                                        aExcelSet[index].Message = element.MESSAGE;

                                        if (element.STATUS === 'S') {
                                            oResult.iSuccess += 1;
                                        } else {
                                            oResult.iFailed += 1;
                                        }
                                    }
                                }
                            });
                        }
                        that.getModel("local").setProperty("/excelSet", aExcelSet);
                        that.getModel("local").setProperty("/logInfo", this.getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                    }).catch((error) => {
                        console.log(error);
                        MessageBox.error((error.message));
                    }).finally(() => {
                        that._BusyDialog.close();
                    });
                } catch (error) {
                    MessageBox.error(error.message);
                    that._BusyDialog.close();
                }
            },

            _callODataAction: function (bEvent, aRequestData) {
                let that = this;
                return new Promise((resolve, reject) => {
                    var uploadProcess = that.getModel().bindContext("/SourceList/com.sap.gateway.srvd.zui_purchasingsourcelist_o4.v0001.processLogic(...)");
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
                var oTable = this.getView().byId("tableSourceList");
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
                            type: (sTemplatePath === "ValidityStartDate" || sTemplatePath === "ValidityEndDate") ? "date" : "string",
                            format: (sTemplatePath === "ValidityStartDate" || sTemplatePath === "ValidityEndDate") ? "yyyy/MM/dd" : "",

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
                    dataSource: aExcelSet, // 传入参数，数据源
                    fileName: "Export_" + this.getResourceBundle().getText("title") + formatter.formatDate(new Date()) + formatter.formatTime(new Date()) + ".xlsx" // 文件名，需要加上后缀
                };

                // 导出excel
                new Spreadsheet(oSettings).build();
            }
        });
    });
