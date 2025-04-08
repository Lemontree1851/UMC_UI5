sap.ui.define([
    "./Base",
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Base, formatter, xlsx, BusyDialog, MessageBox, MessageToast) {
    "use strict";

    return Base.extend("mm.poposting.controller.Main", {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "poposting-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "poposting-View"),
                        Clear: aAllAccessBtns.some(btn => btn.AccessId === "poposting-Clear"),
                        Excute: aAllAccessBtns.some(btn => btn.AccessId === "poposting-Excute"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "poposting-Export")
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
                // read valid data starting from line 6
                for (var i = 4; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "MaterialDocument": "",
                        "MaterialDocumentYear": "",
                        "MaterialDocumentItem": "",
                        "Row": i - 3,
                        // MOD BEGIN BY XINLEI XU 2025/04/08
                        // "DocumentDate": aSheetData[i]["DOCUMENTDATE"] === undefined ? new Date(this.formatDateString(new Date(Date.now()).toUTCString())) : this.formatDateToUtc(aSheetData[i]["DOCUMENTDATE"]),
                        // "PostingDate": aSheetData[i]["POSTINGDATE"] === undefined ? new Date(this.formatDateString(new Date(Date.now()).toUTCString())) : this.formatDateToUtc(aSheetData[i]["POSTINGDATE"]),
                        "DocumentDate": aSheetData[i]["DOCUMENTDATE"] === undefined ? new Date(this.formatDateString(new Date(Date.now()).toUTCString())) : this.convertLocalDateToUTCDate(aSheetData[i]["DOCUMENTDATE"]),
                        "PostingDate": aSheetData[i]["POSTINGDATE"] === undefined ? new Date(this.formatDateString(new Date(Date.now()).toUTCString())) : this.convertLocalDateToUTCDate(aSheetData[i]["POSTINGDATE"]),
                        // MOD BEGIN BY XINLEI XU 2025/04/08
                        "MaterialDocumentHeaderText": aSheetData[i]["MATERIALDOCUMENTHEADERTEXT"] === undefined ? "" : aSheetData[i]["MATERIALDOCUMENTHEADERTEXT"],
                        "OrderKey": aSheetData[i]["PURCHASEORDER"] === undefined ? "" : aSheetData[i]["PURCHASEORDER"],
                        "QuantityInEntryUnit": aSheetData[i]["QUANTITYINENTRY"] === undefined ? "" : aSheetData[i]["QUANTITYINENTRY"],
                        "Batch": aSheetData[i]["BATCH"] === undefined ? "" : aSheetData[i]["BATCH"],
                        "Plant": aSheetData[i]["PLANT"] === undefined ? "" : aSheetData[i]["PLANT"],
                        "StorageLocation": aSheetData[i]["STORAGELOCATION"] === undefined ? "" : aSheetData[i]["STORAGELOCATION"],
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

        formatDateToUtc: function (sDate) {
            // Excel起始日期是1900年1月1日（JavaScript的Date以1970年为基准）
            const oExcelEpoch = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30，Excel从1开始计算
            const iMillisecondsInDay = 24 * 60 * 60 * 1000;

            // 计算日期
            const oDate = new Date(oExcelEpoch.getTime() + Number(sDate) * iMillisecondsInDay);

            // 转换为UTC字符串
            return oDate.toISOString();
        },

        convertLocalDateToUTCDate: function (sDate) {
            let localDate = new Date(sDate);
            // 获取当前时区偏移（分钟）
            let timezoneOffset = localDate.getTimezoneOffset();
            // 调整时区偏移，将本地时间转换为 UTC 时间（时间不变）
            let utcDate = new Date(localDate.getTime() - timezoneOffset * 60000);
            return utcDate;
        },

        onClear: function () {
            this.getModel("local").setProperty("/excelSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },

        onCheck: function () {
            this._callOData("CHECK");
        },

        onExcute: function () {
            this._callOData("EXCUTE");
        },

        onExport: function () {
            this._callOData("EXPORT");
        },

        _callOData: function (bEvent) {
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
                        if (bEvent === "EXPORT") {
                            if (object.RecordUUID) {
                                var sURL = this.getModel("Print").getServiceUrl() + "PrintRecord(RecordUUID=" + object.RecordUUID + ",IsActiveEntity=true)/PDFContent";
                                sap.m.URLHelper.redirect(sURL, true);
                            }
                        } else {
                            JSON.parse(object.Zzkey).forEach(element => {
                                for (var index = 0; index < aExcelSet.length; index++) {
                                    if (aExcelSet[index].Row === element.ROW) {
                                        aExcelSet[index].Status = element.STATUS;
                                        aExcelSet[index].Message = element.MESSAGE;
                                        aExcelSet[index].DocumentDate = element.DOCUMENTDATE;
                                        aExcelSet[index].PostingDate = element.POSTINGDATE;
                                        aExcelSet[index].Plant = element.PLANT;
                                        aExcelSet[index].StorageLocation = element.STORAGELOCATION;
                                        aExcelSet[index].MaterialDocument = element.MATERIALDOCUMENT;
                                        aExcelSet[index].MaterialDocumentYear = element.MATERIALDOCUMENTYEAR;
                                        aExcelSet[index].MaterialDocumentItem = element.MATERIALDOCUMENTITEM;
                                    }
                                }
                                if (element.STATUS === 'E') {
                                    oResult.iFailed += 1;
                                } else {
                                    oResult.iSuccess += 1;
                                }
                            });
                        }
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
                var uploadProcess = this.getModel().bindContext("/ZC_TMM_1011/com.sap.gateway.srvd.zui_tmm_1011_o4.v0001.processLogic(...)");
                uploadProcess.setParameter("Event", bEvent);
                uploadProcess.setParameter("Zzkey", JSON.stringify(aRequestData));
                uploadProcess.setParameter("RecordUUID", '');
                uploadProcess.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(uploadProcess);
                }).catch((error) => {
                    reject(error);
                });
            });
        }
    });
});
