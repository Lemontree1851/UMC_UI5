sap.ui.define([
    "../model/formatter",
    "../lib/xlsx",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (formatter, xlsx, BusyDialog, MessageBox, MessageToast, Fragment) {
    'use strict';

    return {
        formatter: formatter,

        getAuthorityData: function (oModels) {
            var oAuthorityModel = oModels.Authority;
            var oLocalModel = oModels.local;
            var oI18nModel = oModels.i18n;
            var _UserInfo = sap.ushell.Container.getService("UserInfo");
            var sUser = _UserInfo.getFullName() === undefined ? "" : _UserInfo.getFullName();
            var sEmail = _UserInfo.getEmail() === undefined ? "" : _UserInfo.getEmail();
            var oContextBinding = oAuthorityModel.bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-View")) {
                    if (!this.oErrorMessageDialog) {
                        this.oErrorMessageDialog = new sap.m.Dialog({
                            type: sap.m.DialogType.Message,
                            state: "Error",
                            content: new sap.m.Text({
                                text: oI18nModel.getResourceBundle().getText("noAuthorityView", [sUser])
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }
                oLocalModel.setProperty("/authorityCheck", {
                    button: {
                        View: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-View"),
                        Upload: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-BatchUpload"),
                        Clear: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-Clear"),
                        Check: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-Check"),
                        Excute: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-Excute"),
                        Export: aAllAccessBtns.some(btn => btn.AccessId === "zledversioninfo-Export")
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
                            text: oI18nModel.getResourceBundle().getText("getAuthorityFailed")
                        })
                    });
                }
                this.oErrorMessageDialog.open();
            }.bind(this));
        },

        openUploadDialog: function () {
            var that = this;
            this._Function = sap.ui.require("pp/zledversioninfo/ext/controller/ListReportExt");
            this._BusyDialog = new BusyDialog();
            this._BusyDialog.open();
            Fragment.load({
                name: "pp.zledversioninfo.ext.fragments.Upload",
                controller: this
            }).then(function (oDialog) {
                //ダイアログがロードされたら
                this._UploadDialog = oDialog;
                //ダイアログからモデルを使用できるようにする
                this._view.addDependent(this._UploadDialog);
                this._UploadDialog.addButton(new sap.m.Button({
                    text: "{i18n>closeBtn}",
                    press: function () {
                        that.getModel("local").setProperty("/excelSet", []);
                        that.getModel("local").setProperty("/logInfo", "");
                        that._UploadDialog.destroy();
                    }
                }));
                this._BusyDialog.close();
                this._UploadDialog.open();
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
                // read valid data starting from line 7
                for (var i = 5; i < aSheetData.length; i++) {
                    var item = {
                        "Status": "",
                        "Message": "",
                        "Row": i - 4,
                        "Material": aSheetData[i]["Material"] === undefined ? "" : aSheetData[i]["Material"],
                        "Plant": aSheetData[i]["Plant"] === undefined ? "" : aSheetData[i]["Plant"],
                        "VersionInfo": aSheetData[i]["VersionInfo"] === undefined ? "" : aSheetData[i]["VersionInfo"],
                        "Component": aSheetData[i]["Component"] === undefined ? "" : aSheetData[i]["Component"],
                        "DeleteFlag": aSheetData[i]["DeleteFlag"] === undefined ? "" : aSheetData[i]["DeleteFlag"]
                    };
                    aExcelSet.push(item);
                }
                this.getModel("local").setProperty("/excelSet", aExcelSet);
                this.getModel("local").setProperty("/logInfo", this.getModel("i18n").getResourceBundle().getText("logInfo", [aExcelSet.length, 0, 0]));
                sap.ui.getCore().byId("idFileUploader").clear();
                this._BusyDialog.close();
            }.bind(this);
        },

        onClear: function () {
            this.getModel("local").setProperty("/excelSet", []);
            this.getModel("local").setProperty("/logInfo", "");
        },

        onCheck: function () {
            var that = this;
            that._Function._callOData("CHECK", that);
        },

        onExcute: function () {
            var that = this;
            that._Function._callOData("EXCUTE", that);
        },

        onExport: function () {
            var that = this;
            that._Function._callOData("EXPORT", that);
        },

        _callOData: function (bEvent, that) {
            var aPromise = [];
            var aExcelSet = that.getModel("local").getProperty("/excelSet");
            var aGroupKey = that._Function._removeDuplicates(aExcelSet, ["Material", "Plant", "VersionInfo", "Component"]);
            var aGroupItems;
            for (var m = 0; m < aGroupKey.length; m++) {
                const sMaterial = aGroupKey[m].Material;
                const sPlant = aGroupKey[m].Plant;
                const sVersionInfo = aGroupKey[m].VersionInfo;
                const sComponent = aGroupKey[m].Component;
                aGroupItems = [];
                for (var n = 0; n < aExcelSet.length; n++) {
                    if (aExcelSet[n].Material === sMaterial && aExcelSet[n].Plant === sPlant && aExcelSet[n].VersionInfo === sVersionInfo && aExcelSet[n].Component === sComponent) {
                        aGroupItems.push(aExcelSet[n]);
                    }
                }
                aPromise.push(that._Function._callODataAction(bEvent, aGroupItems, that));
            }
            try {
                that._BusyDialog.open();
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
                        if (bEvent === "EXPORT") {
                            if (object.RecordUUID) {
                                var sURL = that.getModel("Print").getServiceUrl() + "PrintRecord(RecordUUID=" + object.RecordUUID + ",IsActiveEntity=true)/PDFContent";
                                sap.m.URLHelper.redirect(sURL, true);
                            }
                        } else {
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
                    }
                    that.getModel("local").setProperty("/excelSet", aExcelSet);
                    that.getModel("local").setProperty("/logInfo", that.getModel("i18n").getResourceBundle().getText("logInfo", [aExcelSet.length, oResult.iSuccess, oResult.iFailed]));
                    MessageToast.show(that.getModel("i18n").getResourceBundle().getText("ProcessingCompleted"));
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    that._BusyDialog.close();
                });
            } catch (error) {
                MessageBox.error(error);
                that._BusyDialog.close();
            }
        },

        _callODataAction: function (bEvent, aRequestData, that) {
            return new Promise((resolve, reject) => {
                var uploadProcess = that.getModel().bindContext("/ZC_LEDPRODUCTIONVERSION/com.sap.gateway.srvd.zui_ledproductionversion_o4.v0001.processLogic(...)");
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

        _removeDuplicates: function (arr, keys) {
            return arr.reduce((result, obj) => {
                const index = result.findIndex(item => {
                    return keys.every(key => item[key] === obj[key]);
                });
                if (index !== -1) {
                    result[index] = obj;
                } else {
                    result.push(obj);
                }
                return result;
            }, []);
        }
    };
});
