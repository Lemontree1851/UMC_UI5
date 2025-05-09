sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "./messages",
    "../../lib/xml-js",
    "../../lib/decimal",
    "sap/ui/core/Fragment",
    "sap/m/Dialog"
], function (MessageToast, BusyDialog, messages, xml, decimal, Fragment, Dialog) {
    'use strict';
    var _oFunctions, _ResourceBundle, _oDataModel, _oPrintModel, _UserInfo;
    return {
        init: function (oModels) {
            _oFunctions = this;

            _UserInfo = sap.ushell.Container.getService("UserInfo");

            // Authority Check
            var oAuthorityModel = oModels.Authority;
            var oLocalModel = oModels.local;
            var oI18nModel = oModels.i18n;
            this._getAuthorityData(oAuthorityModel, oLocalModel, oI18nModel);
        },
        _getAuthorityData: function (oAuthorityModel, oLocalModel, oI18nModel) {
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
                if (!aAllAccessBtns.some(btn => btn.AccessId === "invoiceprint-View")) {
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
                        View: aAllAccessBtns.some(btn => btn.AccessId === "invoiceprint-View"),
                        Print: aAllAccessBtns.some(btn => btn.AccessId === "invoiceprint-Print"),
                        Reprint: aAllAccessBtns.some(btn => btn.AccessId === "invoiceprint-Reprint"),
                        Clear: aAllAccessBtns.some(btn => btn.AccessId === "invoiceprint-Clear")
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
        onPrint: function (oEvent) {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();
            this.sAction = "printInvoice";
            _oFunctions.onDialogPress(this.routing, this, this.sAction);

            // // 获取选择的行项目
            // if (this.getSelectedContexts) {
            //     var aSelectedContexts = this.getSelectedContexts();
            // }
            // _oFunctions.onCustomAction(aSelectedContexts,"printInvoice");

        },

        onReprint: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();
            this.sAction = "reprintInvoice";
            _oFunctions.onDialogPress(this.routing, this, this.sAction);
            // // 获取选择的行项目
            // if (this.getSelectedContexts) {
            //     var aSelectedContexts = this.getSelectedContexts();
            // }
            // _oFunctions.onCustomAction(aSelectedContexts,"reprintInvoice");
        },

        onDelete: function () {
            _oDataModel = this.getModel();
            _oPrintModel = this.getModel("Print");
            _ResourceBundle = this.getModel("i18n").getResourceBundle();
            this.sAction = "deleteInovice";
            // 获取选择的行项目
            if (this.getSelectedContexts) {
                var aSelectedContexts = this.getSelectedContexts();
            }
            _oFunctions.onCustomAction(aSelectedContexts, this.sAction);
        },

        onCustomAction: function (aSelectedContexts, sActionName, sPrintDate, sCreator, sApprover) {
            var aSelectedItem = [];
            var aPromise = [];
            var aItems = [];
            aSelectedContexts.forEach(function (item) {
                var itemObject = item.getObject();
                aSelectedItem.push(item.getObject());
                aItems.push({
                    BillingDocument: itemObject.BillingDocument,
                    BillingDocumentItem: itemObject.BillingDocumentItem,
                });
            });
            if (_oFunctions.checkInconsistencies(aSelectedItem)) {
                messages.showError(_ResourceBundle.getText("msgInconsistencies"));
                return;
            }

            aPromise.push(_oFunctions.printAction(aItems, sActionName));

            Promise.all(aPromise).then(function (records) {
                records.forEach(record => {
                    if (sActionName !== "deleteInovice") {
                        var pdfContent = _oFunctions.porcessPrintContent(record, sPrintDate, sCreator, sApprover);
                        _oFunctions.getPDF(pdfContent);
                    } else {
                        messages.showSuccess(_ResourceBundle.getText("msgDeleteSuccessed"));
                    }
                });
            });
        },

        printAction: function (items, sActionName) {
            var oBusyDialog = new BusyDialog();
            var promise = new Promise(function (resolve, reject) {
                var oAction = _oDataModel.bindContext("/InvoiceReport/com.sap.gateway.srvd.zui_invoicereport_o4.v0001." + sActionName + "(...)");
                oAction.setParameter("Zzkey", JSON.stringify(items));
                oAction.setParameter("Event", "");
                oAction.setParameter("RecordUUID", "");
                oBusyDialog.open();
                oAction.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    oBusyDialog.close();
                    try {
                        var records = oAction.getBoundContext().getObject().value; //获取返回的数据
                    } catch (e) { }
                    resolve(records);
                }).catch((oError) => {
                    oBusyDialog.close();
                    messages.showError(oError.message);
                    reject(oError);
                });
            });
            return promise;
        },

        //接收到从action返回的数据后，处理成PDF需要的
        porcessPrintContent: function (aSelectedItem, sPrintDate, sCreator, sApprover) {
            // 检查选择的数据打印的维度是否一致，如果不一致则报错
            if (this.checkInconsistencies(aSelectedItem)) {
                messages.showError(_ResourceBundle.getText("msgInconsistencies"));
                return;
            }
            var pdfContent = {
                PrintData: {
                    results: []
                }
            };
            //合计相关金额字段
            var iTotalNetAmount10 = 0,
                iTotalNetAmountTax10 = 0,
                iTotalNetAmountIncludeTax10 = 0,
                iTotalNetAmountExclude = 0;
            aSelectedItem.forEach(item => {
                iTotalNetAmount10 = Decimal.add(iTotalNetAmount10, item.NetAmount10);
                iTotalNetAmountExclude = Decimal.add(iTotalNetAmountExclude, item.NetAmountExclude);
            });
            iTotalNetAmount10 = iTotalNetAmount10.toFixed(0);
            iTotalNetAmountTax10 = Decimal.mul(iTotalNetAmount10, 0.1).toFixed(0);
            iTotalNetAmountIncludeTax10 = Decimal.add(iTotalNetAmount10, iTotalNetAmountTax10);
            iTotalNetAmountExclude = iTotalNetAmountExclude.toFixed(0);
            // 请求书抬头
            var InvoicePrint = {
                PrintDate: sPrintDate,
                // ADD BEGIN BY XINLEI XU 2025/01/14
                Creator: sCreator,
                Approver: sApprover,
                // ADD END BY XINLEI XU 2025/01/14
                InvoiceNo: aSelectedItem[0].InvoiceNo,
                TheCompanyPostalCode: aSelectedItem[0].TheCompanyPostalCode,
                TheCompanyName: aSelectedItem[0].TheCompanyName,
                TheCompanyCity: aSelectedItem[0].TheCompanyCity,
                TheCompanyTelNumber: aSelectedItem[0].TheCompanyTelNumber,
                TheCompanyFaxNumber: aSelectedItem[0].TheCompanyFaxNumber,
                PostalCode: aSelectedItem[0].PostalCode,
                CityName: aSelectedItem[0].CityName,
                CustomerName: aSelectedItem[0].CustomerName,
                TelephoneNumber1: aSelectedItem[0].TelephoneNumber1,
                FaxNumber: aSelectedItem[0].FaxNumber,
                TotalNetAmount: Decimal(aSelectedItem[0].TotalNetAmount).toFixed(0),
                CompanyCodeParameterValue: aSelectedItem[0].CompanyCodeParameterValue,
                RemitAddress: aSelectedItem[0].RemitAddress,
                NetAmount10: iTotalNetAmount10.valueOf(),
                NetAmountTax10: iTotalNetAmountTax10.valueOf(),
                NetAmountIncludeTax10: iTotalNetAmountIncludeTax10.valueOf(),
                NetAmountExclude: iTotalNetAmountExclude.valueOf(),
                to_Item: {
                    results: []
                }
            }
            // 请求书行项目
            var results = [];
            aSelectedItem.forEach(item => {
                results.push({
                    BillingDocumentItem: item.BillingDocumentItem,
                    BillingDocumentDate: item.BillingDocumentDate,
                    SalesDocument: item.SalesDocument,
                    MaterialByCustomer: item.MaterialByCustomer || item.Product,
                    BillingDocumentItemText: item.BillingDocumentItemText,
                    BillingQuantity: item.BillingQuantity,
                    UnitPrice: item.UnitPrice,
                    NetAmount: item.NetAmount,
                    TaxRate: item.TaxRate,
                    // ADD BEGIN BY XINLEI XU 2025/04/18 CM#4423
                    PurchaseOrderByCustomer: item.PurchaseOrderByCustomer,
                    YY1_ItemRemarks_1_BDI: item.YY1_ItemRemarks_1_BDI
                    // ADD END BY XINLEI XU 2025/04/18 CM#4423
                });
            });
            InvoicePrint.to_Item.results = results;
            pdfContent = {
                PrintData: InvoicePrint
            }
            return pdfContent;
        },

        getPDF: function (pdfContent) {
            var that = this;
            var oBusyDialog = new BusyDialog();
            var aRecordCreated = [];
            var sFileName = _ResourceBundle.getText("appTitle") + new Date().getTime();
            var promise = new Promise((resolve, reject) => {
                var createPrintRecord = _oPrintModel.bindContext("/PrintRecord/com.sap.gateway.srvd.zui_prt_record_o4.v0001.createPrintRecord(...)");
                createPrintRecord.setParameter("TemplateID", "YY1_SD019");
                createPrintRecord.setParameter("IsExternalProvidedData", true);
                var oXMLData = json2xml(pdfContent, {
                    compact: true,
                    ignoreComment: true,
                    spaces: 4
                });
                // var pdfData =  btoa(unescape(encodeURIComponent(oXMLData)));
                var pdfData = btoa(unescape(encodeURIComponent("<?xml version=\"1.0\" encoding=\"UTF-8\"?><form>" + oXMLData + "</form>")));
                createPrintRecord.setParameter("ExternalProvidedData", pdfData);
                // var uuidx16 = context.getObject().Uuid.replace(/-/g, '');
                createPrintRecord.setParameter("ProvidedKeys", "");
                createPrintRecord.setParameter("ResultIsActiveEntity", true);
                createPrintRecord.setParameter("FileName", sFileName);
                createPrintRecord.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(createPrintRecord);
                }).catch((oError) => {
                    reject(oError);
                });
            });
            aRecordCreated.push(promise);

            oBusyDialog.open();
            try {
                Promise.all(aRecordCreated).then((aContext) => {
                    oBusyDialog.close();
                    var sURL;
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var sPath = _oPrintModel.getKeyPredicate("/PrintRecord", object);
                        sURL = activeContext.getModel("Print").getServiceUrl() + "PrintRecord" + sPath + '/PDFContent';
                        sap.m.URLHelper.redirect(sURL, true);
                    }
                    MessageToast.show("Print Success");
                }).finally(() => {
                    oBusyDialog.close();
                });;
            } catch (error) {
                MessageToast.show(error);
                oBusyDialog.close();
            }
        },

        checkInconsistencies: function (aExcelSet) {
            let isInconsistencies = false;
            // 如果数组为空或只有一个对象，直接返回一致
            if (aExcelSet.length <= 1) return false;

            // 取第一个对象的这几个属性作为比较基准
            const { SoldToParty, ShippingPoint } = aExcelSet[0];

            // 遍历数组，检查每个对象的这几个属性是否与基准一致
            for (let i = 1; i < aExcelSet.length; i++) {
                const obj = aExcelSet[i];
                if (
                    obj.SoldToParty !== SoldToParty ||
                    obj.ShippingPoint !== ShippingPoint
                ) {
                    // aExcelSet[i].Type = "E";
                    // aExcelSet[i].Message = this._ResourceBundle.getText("msgDuplicate");
                    isInconsistencies = true; // 发现不一致，返回 true
                }
            }
            return isInconsistencies; // 所有对象都一致，返回 false
        },

        onDialogPress: function (oRouting, that, sAction) {
            if (!this.Dialog) {
                var oView = oRouting.getView();
                if (!this.Dialog) {
                    this.Dialog = Fragment.load({
                        id: oView.getId(),
                        name: "sd.invoiceprint.ext.fragment.Dialog",
                        controller: that
                    }).then(function (oDialog) {
                        return oDialog;
                    }.bind(this));
                }
            }
            this.Dialog.then(function (oDialog) {
                oRouting.getView().addDependent(oDialog);
                oDialog.setBeginButton(new sap.m.Button({
                    text: "{i18n>bConfirm}",
                    press: function () {
                        var sPrintDate = oRouting.getView().byId("idPrintDate").getValue();
                        if (sPrintDate === '') {
                            const currentDate = new Date();
                            sPrintDate = currentDate.toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            }).replace(/\//g, '/'); // 将年月日间的分隔符改为"/"
                        }
                        // 获取选择的行项目
                        if (that.getSelectedContexts) {
                            var aSelectedContexts = that.getSelectedContexts();
                        }
                        // ADD BEGIN BY XINLEI XU 2025/01/14
                        var sCreator = ""; // oRouting.getView().byId("idCreator").getValue();
                        var sApprover = ""; // oRouting.getView().byId("idApprover").getValue();
                        // ADD END BY XINLEI XU 2025/01/14
                        _oFunctions.onCustomAction(aSelectedContexts, sAction, sPrintDate, sCreator, sApprover);
                        oDialog.close();
                    }
                }));
                oDialog.setEndButton(new sap.m.Button({
                    text: "{i18n>bCancel}",
                    press: function () {
                        oDialog.close();
                    }
                }));
                oDialog.open();
            }.bind(this));
        }
    };
});
