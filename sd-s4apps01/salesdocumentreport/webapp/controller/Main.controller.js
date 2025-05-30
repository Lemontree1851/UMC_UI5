sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "./messages",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
],
    function (Controller, formatter, messages, Filter, FilterOperator, BusyDialog, MessageBox, Spreadsheet) {
        "use strict";

        return Controller.extend("sd.salesdocumentreport.controller.Main", {

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                //this._updateColumnHeaders();
                this.aHttpRequest = [];
                this.dataFinished = true;
                this._ResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                this._BusyDialog = new BusyDialog();
                // *************************************************
                this._UserInfo = sap.ushell.Container.getService("UserInfo");
                this.getOwnerComponent().getRouter().getRoute("Main").attachMatched(this._initialize, this);
            },

            _initialize: function () {
                var sUser = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();
                var sEmail = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
                var oContextBinding = this.getOwnerComponent().getModel("Authority").bindContext("/User(Mail='" + sEmail + "',IsActiveEntity=true)", undefined, {
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
                    if (!aAllAccessBtns.some(btn => btn.AccessId === "salesdocumentreport-View")) {
                        if (!this.oErrorMessageDialog) {
                            this.oErrorMessageDialog = new sap.m.Dialog({
                                type: sap.m.DialogType.Message,
                                state: "Error",
                                content: new sap.m.Text({
                                    text: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("noAuthorityView", [sUser])
                                })
                            });
                        }
                        this.oErrorMessageDialog.open();
                    }
                    this.getOwnerComponent().getModel("local").setProperty("/authorityCheck", {
                        button: {
                            View: aAllAccessBtns.some(btn => btn.AccessId === "salesdocumentreport-View"),
                            Export: aAllAccessBtns.some(btn => btn.AccessId === "salesdocumentreport-Export"),
                            BITransfer: aAllAccessBtns.some(btn => btn.AccessId === "salesdocumentreport-BITransfer")
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
                                text: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("getAuthorityFailed")
                            })
                        });
                    }
                    this.oErrorMessageDialog.open();
                }.bind(this));
            },

            onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
                // var mBindingParams = oEvent.getParameter("bindingParams");
                // var newfilter;

                // // var oSelect = this.byId("idplantype"); // 通过ID获取Select控件
                // // var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                // // newfilter = new sap.ui.model.Filter("plantype", sap.ui.model.FilterOperator.EQ, selectedKey);
                // // mBindingParams.filters.push(newfilter);

                // var oSelect = this.byId("idMonat"); // 通过ID获取Select控件
                // var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                // newfilter = new sap.ui.model.Filter("YearDate", sap.ui.model.FilterOperator.EQ, selectedKey);
                // mBindingParams.filters.push(newfilter);

                //newfilter = new sap.ui.model.Filter("YearDate", sap.ui.model.FilterOperator.EQ, selectedKey);
                //mBindingParams.filters.push(newfilter);

            },

            onMonthChange: function (oEvent) {
                // 获取选择的月份
                var selectedMonth = oEvent.getParameter("selectedItem").getKey();  // 

                // 获取当前年份
                var currentDate = new Date();
                var currentYear = currentDate.getFullYear();
                var monthArray = [];

                // 根据选择的月份计算当前年份和前五个月
                for (var i = 0; i < 5; i++) {
                    var newMonth = parseInt(selectedMonth) - i; // 计算新月份
                    var year = currentYear;

                    // 如果月份小于1，切换到上一年
                    if (newMonth < 1) {
                        newMonth = 12 + newMonth;  // 处理月份跨年
                        year = currentYear - 1;    // 切换到上一年
                    }

                    // 格式化为 "YYYY年M月"
                    var formattedMonth = year + "年" + (newMonth < 10 ? "0" + newMonth : newMonth) + "月";
                    monthArray.push(formattedMonth);  // 将格式化的月份添加到数组
                }

                // 调用方法更新列标题
                this._updateColumnHeaders(monthArray);
            },

            onSearch: function (oEvent) {
                var oSmartFilterBar = this.byId("idSmartFilterBar");
                var oFilterData = oSmartFilterBar.getFilterData();

                var SalesPlanVersion0 = oFilterData.SalesPlanVersion0;
                var SalesPlanVersion1 = oFilterData.SalesPlanVersion1;
                var SalesPlanVersion2 = oFilterData.SalesPlanVersion2;
                var SalesPlanVersion3 = oFilterData.SalesPlanVersion3;

                // allVersionsEmpty=値計画の売上&貢献利益&売上総利益が関連しますので、全部入力してください！
                // zeroEmptyWithAtLeastOneEmpty=値計画の売上&貢献利益&売上総利益が関連しますので、全部入力してください！
                // oneTwoThreeStartWithWrong=入力された検索条件が正しくなく、ルールに従って入力してください。

                // Check if all SalesPlanVersion fields are empty
                if (!SalesPlanVersion0 && !SalesPlanVersion1 && !SalesPlanVersion2 && !SalesPlanVersion3) {
                    sap.m.MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("allVersionsEmpty"));
                    return;
                }
                // Check if SalesPlanVersion0 is empty and any of the other SalesPlanVersion fields are empty
                if (!SalesPlanVersion0 && (!SalesPlanVersion1 || !SalesPlanVersion2 || !SalesPlanVersion3)) {
                    sap.m.MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("zeroEmptyWithAtLeastOneEmpty"));
                    return;
                }
                // Check if SalesPlanVersion1, SalesPlanVersion2, SalesPlanVersion3 have the same starting letter and it's either 'A' or 'B'
                var versions = [SalesPlanVersion1, SalesPlanVersion2, SalesPlanVersion3].filter(key => key !== null && key !== undefined && key !== '');
                if (versions.length > 0) { // Only check if there are any non-empty versions
                    var firstLetter = versions[0][0];
                    if (!['A', 'B'].includes(firstLetter)) {
                        sap.m.MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("oneTwoThreeStartWithWrong"));
                        return;
                    }

                    for (var i = 1; i < versions.length; i++) {
                        if (versions[i][0] !== firstLetter) {
                            sap.m.MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("oneTwoThreeStartWithWrong"));
                            return;
                        }
                    }
                }

                var aResultTemp = this._LocalData.getProperty("/SalesReport");
                this.delColumns(aResultTemp);

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
                    var oSelect = this.byId("idplantype"); // 通过ID获取Select控件
                    var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                    aNewFilter.push(new Filter("plantype", "EQ", selectedKey));

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
                        let sParamtetrsOfSelect = "SalesOrganization,Customer,YearDate,Product,plantype,CustomerName,ProfitCenter,Plant,PlantName,SalesOffice,SalesGroup,CreatedByUser,MatlAccountAssignmentGroup,ProductGroup,ProductName,MaterialCost2000,Manufacturingcost,ContributionProfit,GrossProfit,CustomerAccountAssignmentGroup,FirstSalesSpecProductGroup,SecondSalesSpecProductGroup,ThirdSalesSpecProductGroup,AccountDetnProductGroup,ConditionRateValue_n,salesplanamountindspcrcy_n,SalesAmount_n,ContributionProfitTotal_n,GrossProfitTotal_n,materialcost2000per_n,Manufacturingcostper_n,materialcost2000_n,Manufacturingcost_n,GLAccount1,GLAccountName1,GLAccount2,GLAccountName2,GLAccount3,GLAccountName3,DisplayCurrency1,currency,currency1,SalesPlanUnit,CompanyCode";
                        //获取数据
                        this._LocalData.setProperty("/SalesReport", []);
                        this._LocalData.setProperty("/SalesReportTemp", []);
                        this.getEntityContentOnePage(iItemCount, 0, aFilter, sParamtetrsOfSelect, splitRange);

                    } else {
                        this._LocalData.setProperty("/SalesReport", []);
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
                    that.getOwnerComponent().getModel().read("/SalesReport/$count", mParameters);
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

                var aResult = that._LocalData.getProperty("/SalesReport");
                var aResultTemp = that._LocalData.getProperty("/SalesReportTemp");

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
                                aResultTemp.push.apply(aResultTemp, oData.results);
                                that._LocalData.setProperty("/SalesReportTemp", aResultTemp);
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
                                    that._LocalData.setProperty("/SalesReport", []);
                                }
                                that.aHttpRequest.forEach(function (req) {
                                    req.abort();
                                });
                                reject();
                            }
                        }
                    };
                    that.getOwnerComponent().getModel().setUseBatch(false);
                    that.aHttpRequest.push(that.getOwnerComponent().getModel().read("/SalesReport", mParameters));
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
                        aResultTemp = that._LocalData.getProperty("/SalesReportTemp");
                        aResult = that.transformData(aResultTemp);
                        //console.log("aResult", aResult);
                        that._LocalData.setProperty("/SalesReport", aResult);
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
                    // 使用SalesOrganization, Customer, ProfitCenter ,salesoffice ,salesgroup , Product, plantype作为key值组合
                    const key = `${item.SalesOrganization}_${item.Customer}_${item.ProfitCenter}_${item.salesoffice}_${item.salesgroup}_${item.Product}_${item.plantype}`;

                    // 如果当前组合的key不存在于result中，则初始化它
                    if (!result[key]) {
                        result[key] = {
                            // Type: item.Type,
                            // Message: item.Message,
                            SalesOrganization: item.SalesOrganization,
                            Customer: item.Customer,
                            YearDate: item.YearDate,
                            Product: item.Product,
                            plantype: item.plantype,

                            ProfitCenter: item.ProfitCenter,
                            Plant: item.Plant, // ADD BY XINLEI XU 2025/02/17
                            PlantName: item.PlantName,
                            CustomerName: item.CustomerName,
                            SalesOffice: item.SalesOffice,
                            SalesGroup: item.SalesGroup,
                            CreatedByUser: item.CreatedByUser,
                            MatlAccountAssignmentGroup: item.MatlAccountAssignmentGroup,
                            ProductGroup: item.ProductGroup,
                            ProductName: item.ProductName,
                            //ConditionRateValue: item.ConditionRateValue,
                            materialcost2000_n: item.materialcost2000_n,
                            Manufacturingcost_n: item.Manufacturingcost_n,
                            //SalesAmount: item.SalesAmount,
                            ContributionProfit: item.ContributionProfit,
                            GrossProfit: item.GrossProfit,
                            //ContributionProfitTotal: item.ContributionProfitTotal,
                            //GrossProfitTotal: item.GrossProfitTotal,
                            //salesplanamountindspcrcy: item.salesplanamountindspcrcy,
                            CustomerAccountAssignmentGroup: item.CustomerAccountAssignmentGroup,
                            FirstSalesSpecProductGroup: item.FirstSalesSpecProductGroup,
                            SecondSalesSpecProductGroup: item.SecondSalesSpecProductGroup,
                            ThirdSalesSpecProductGroup: item.ThirdSalesSpecProductGroup,
                            AccountDetnProductGroup: item.AccountDetnProductGroup,

                            GLAccount1: item.GLAccount1,
                            GLAccountName1: item.GLAccountName1,
                            GLAccount2: item.GLAccount2,
                            GLAccountName2: item.GLAccountName2,
                            GLAccount3: item.GLAccount3,
                            GLAccountName3: item.GLAccountName3,

                            CompanyCode: item.CompanyCode,

                            DisplayCurrency1: item.DisplayCurrency1,
                            currency: item.currency,
                            currency1: item.currency1,
                            SalesPlanUnit: item.SalesPlanUnit,

                            ConditionRateValues: {},
                            materialcost2000pers: {},
                            Manufacturingcostpers: {},
                            salesplanamountindspcrcys: {},
                            SalesAmounts: {},
                            ContributionProfitTotals: {},
                            GrossProfitTotals: {}
                        };
                    }

                    // 将日期作为列名，使用ConditionRateValue填充


                    let YearDate = item.YearDate.toString();

                    const dateKey5 = `materialcost2000per${YearDate}`;
                    const dateKey6 = `Manufacturingcostper${YearDate}`;
                    const dateKey = `ConditionRateValue${YearDate}`;
                    const dateKey1 = `salesplanamountindspcrcy${YearDate}`;
                    const dateKey2 = `SalesAmount${YearDate}`;
                    const dateKey3 = `ContributionProfitTotal${YearDate}`;
                    const dateKey4 = `GrossProfitTotal${YearDate}`;

                    result[key].ConditionRateValues[dateKey] = item.ConditionRateValue_n;
                    result[key].materialcost2000pers[dateKey5] = item.materialcost2000per_n;
                    result[key].Manufacturingcostpers[dateKey6] = item.Manufacturingcostper_n;
                    result[key].salesplanamountindspcrcys[dateKey1] = item.salesplanamountindspcrcy_n;
                    result[key].SalesAmounts[dateKey2] = item.SalesAmount_n;
                    result[key].ContributionProfitTotals[dateKey3] = item.ContributionProfitTotal_n;
                    result[key].GrossProfitTotals[dateKey4] = item.GrossProfitTotal_n;
                });

                // 将对象转化为数组形式，并将ConditionRateValues展开为列
                return Object.values(result).map(item => {
                    return {
                        SalesOrganization: item.SalesOrganization,
                        Customer: item.Customer,

                        Product: item.Product,
                        plantype: item.plantype,

                        ProfitCenter: item.ProfitCenter,
                        Plant: item.Plant, // ADD BY XINLEI XU 2025/02/17
                        PlantName: item.PlantName,
                        CustomerName: item.CustomerName,
                        SalesOffice: item.SalesOffice,
                        SalesGroup: item.SalesGroup,
                        CreatedByUser: item.CreatedByUser,
                        MatlAccountAssignmentGroup: item.MatlAccountAssignmentGroup,
                        ProductGroup: item.ProductGroup,
                        ProductName: item.ProductName,
                        //ConditionRateValue: item.ConditionRateValue,
                        materialcost2000_n: item.materialcost2000_n,
                        Manufacturingcost_n: item.Manufacturingcost_n,
                        //SalesAmount: item.SalesAmount,
                        ContributionProfit: item.ContributionProfit,
                        GrossProfit: item.GrossProfit,
                        //ContributionProfitTotal: item.ContributionProfitTotal,
                        //GrossProfitTotal: item.GrossProfitTotal,
                        //salesplanamountindspcrcy: item.salesplanamountindspcrcy,
                        CustomerAccountAssignmentGroup: item.CustomerAccountAssignmentGroup,
                        FirstSalesSpecProductGroup: item.FirstSalesSpecProductGroup,
                        SecondSalesSpecProductGroup: item.SecondSalesSpecProductGroup,
                        ThirdSalesSpecProductGroup: item.ThirdSalesSpecProductGroup,
                        AccountDetnProductGroup: item.AccountDetnProductGroup,

                        GLAccount1: item.GLAccount1,
                        GLAccountName1: item.GLAccountName1,
                        GLAccount2: item.GLAccount2,
                        GLAccountName2: item.GLAccountName2,
                        GLAccount3: item.GLAccount3,
                        GLAccountName3: item.GLAccountName3,

                        CompanyCode: item.CompanyCode,

                        DisplayCurrency1: item.DisplayCurrency1,
                        currency: item.currency,
                        currency1: item.currency1,
                        SalesPlanUnit: item.SalesPlanUnit,

                        ...item.ConditionRateValues,
                        ...item.materialcost2000pers,// 展开动态生成的日期列
                        ...item.Manufacturingcostpers,
                        ...item.salesplanamountindspcrcys,
                        ...item.SalesAmounts,
                        ...item.ContributionProfitTotals,
                        ...item.GrossProfitTotals

                    };
                });
            },

            addColumns: function () {
                var ofpartition = this._LocalData.getProperty("/SalesReport");
                //console.log("ofpartition", ofpartition);
                if (ofpartition.length > 0) {
                    Object.keys(ofpartition[0]).forEach(function (key) {
                        //单价
                        if (key.indexOf("ConditionRateValue") >= 0) {
                            this.addColumn(key, this);
                        }
                        //贡献利润(单价)
                        if (key.indexOf("materialcost2000per") >= 0) {
                            this.addColumn(key, this);
                        }
                        //销售总利润(单价)
                        if (key.indexOf("Manufacturingcostper") >= 0) {
                            this.addColumn(key, this);
                        }
                        //QTY
                        if (key.indexOf("salesplanamountindspcrcy") >= 0) {
                            this.addColumn(key, this);
                        }
                        //销售额
                        if (key.indexOf("SalesAmount") >= 0) {

                            this.addColumn(key, this);
                        }
                        //贡献利润
                        if (key.indexOf("ContributionProfitTotal") >= 0) {
                            this.addColumn(key, this);
                        }
                        //销售总利润
                        if (key.indexOf("GrossProfitTotal") >= 0) {
                            this.addColumn(key, this);
                        }
                    }.bind(this));
                }
            },
            delColumns: function (aResultTemp) {
                if (aResultTemp) {
                    if (aResultTemp.length > 0) {
                        Object.keys(aResultTemp[0]).forEach(function (key) {
                            if (key.indexOf("ConditionRateValue") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("materialcost2000per") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("Manufacturingcostper") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("salesplanamountindspcrcy") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("SalesAmount") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("ContributionProfitTotal") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                            if (key.indexOf("GrossProfitTotal") >= 0) {
                                if (this.byId(key)) {
                                    this.byId(key).destroyLabel();
                                    this.byId(key).destroyTemplate();
                                    this.byId(key).destroy(true);
                                }
                            }
                        }.bind(this));
                    }
                }
            },
            addColumn: function (sColName, oObj) {

                var sBindingPath = `{path:'local>${sColName}', type:'sd.salesdocumentreport.controller.CustomDecimal'}`;
                // 生成Text控件
                var oText = new sap.m.Text({
                    text: sBindingPath,
                    tooltip: "{local>" + sColName + "}"
                });
                var ConditionRateValueLabel = oObj._ResourceBundle.getText("ConditionRateValueLabel") + "(";
                var materialcost2000perLabel = oObj._ResourceBundle.getText("materialcost2000perLabel") + "(";
                var ManufacturingcostperLabel = oObj._ResourceBundle.getText("ManufacturingcostperLabel") + "(";
                var salesplanamountindspcrcyLabel = oObj._ResourceBundle.getText("salesplanamountindspcrcyLabel") + "(";
                var SalesAmountLabel = oObj._ResourceBundle.getText("SalesAmountLabel") + "(";
                var ContributionProfitTotalLabel = oObj._ResourceBundle.getText("ContributionProfitTotalLabel") + "(";
                var GrossProfitTotalLabel = oObj._ResourceBundle.getText("GrossProfitTotalLabel") + "(";

                // MOD BEGIN BY XINLEI XU 2025/04/17
                // var sLabel = sColName;
                var sLabel = sColName.split("_")[0]; // 下划线后 新拼接了会计年月
                // MOD END BY XINLEI XU 2025/04/17

                sLabel = sLabel.replace("ConditionRateValue", ConditionRateValueLabel);
                sLabel = sLabel.replace("materialcost2000per", materialcost2000perLabel);
                sLabel = sLabel.replace("Manufacturingcostper", ManufacturingcostperLabel);
                sLabel = sLabel.replace("salesplanamountindspcrcy", salesplanamountindspcrcyLabel);
                sLabel = sLabel.replace("SalesAmount", SalesAmountLabel);
                sLabel = sLabel.replace("ContributionProfitTotal", ContributionProfitTotalLabel);
                sLabel = sLabel.replace("GrossProfitTotal", GrossProfitTotalLabel);

                sLabel = sLabel + ")";

                var oCustomDataValue = { columnKey: sColName, leadingProperty: sColName };
                var sWidth = "12rem";
                var shAlign = "Begin";
                if (sColName.indexOf("ConditionRateValue") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("materialcost2000per") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("Manufacturingcostper") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("salesplanamountindspcrcy") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("SalesAmount") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("ContributionProfitTotal") >= 0) {
                    shAlign = "End";
                }
                if (sColName.indexOf("GrossProfitTotal") >= 0) {
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
                oObj.getView().byId("Table_Calc").addColumn(oColumn);
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
                //console.log(aTableCol);
                for (var i = 0; i < aTableCol.length; i++) {
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
            onExportBI: function (oEvent) {
                var sId = oEvent.getSource().getParent().getParent().getId();
                // 根据id值获取table 
                var oTable = this.getView().byId(sId);
                // 获取table的绑定路径
                var sPath = oTable.getBindingPath("rows");
                // 获取table数据
                var aExcelSet = this._LocalData.getProperty(sPath);
                var aExcelSetBI = [];
                //console.log(aExcelSet);

                // ADD BEGIN BY XINLEI XU 2025/02/11
                var oSmartFilterBar = this.byId("idSmartFilterBar");
                var oFilterData = oSmartFilterBar.getFilterData();
                var SalesPlanVersion0 = oFilterData.SalesPlanVersion0;
                var sPlanCategory = "";
                switch (SalesPlanVersion0.substring(0, 1)) {
                    case "A":
                        sPlanCategory = "BDG";
                        break;
                    case "B":
                        sPlanCategory = "PLN";
                        break;
                    default:
                        break;
                }
                // ADD END BY XINLEI XU 2025/02/11

                for (var i = 0; i < aExcelSet.length; i++) {
                    // MOD BEGIN BY XINLEI XU 2025/02/19
                    // var firstSalesSpecProductGroup = aExcelSet[i].FirstSalesSpecProductGroup.match(/^\d+/);
                    // var secondSalesSpecProductGroup = aExcelSet[i].SecondSalesSpecProductGroup.match(/^\d+/);
                    // var thirdSalesSpecProductGroup = aExcelSet[i].ThirdSalesSpecProductGroup.match(/^\d+/);
                    var firstSalesSpecProductGroup = aExcelSet[i].FirstSalesSpecProductGroup.split("(");
                    var secondSalesSpecProductGroup = aExcelSet[i].SecondSalesSpecProductGroup.split("(");
                    var thirdSalesSpecProductGroup = aExcelSet[i].ThirdSalesSpecProductGroup.split("(");
                    // MOD END BY XINLEI XU 2025/02/19

                    var baseItem = {
                        "Plan_Category": sPlanCategory, // "PLN", MOD BY XINLEI XU 2025/02/11
                        "CompanyCode": aExcelSet[i].CompanyCode,
                        "Plant": aExcelSet[i].Plant,
                        "ProfitCenter": aExcelSet[i].ProfitCenter,
                        "Customer": aExcelSet[i].Customer,
                        "Product": aExcelSet[i].Product,
                        "FirstSalesSpecProductGroup": firstSalesSpecProductGroup ? firstSalesSpecProductGroup[0] : null,
                        "SecondSalesSpecProductGroup": secondSalesSpecProductGroup ? secondSalesSpecProductGroup[0] : null,
                        "ThirdSalesSpecProductGroup": thirdSalesSpecProductGroup ? thirdSalesSpecProductGroup[0] : null, // Extract or set to null if no match
                        // MOD BEGIN BY XINLEI XU 2025/02/18
                        // "MatlAccountAssignmentGroup": aExcelSet[i].MatlAccountAssignmentGroup,
                        "AccountDetnProductGroup": aExcelSet[i].AccountDetnProductGroup
                        // MOD END BY XINLEI XU 2025/02/18
                    };

                    Object.keys(aExcelSet[i]).forEach(key => {
                        if (key.startsWith("SalesAmount")) {

                            var yearMonth = key.replace("SalesAmount", "");
                            var yearPeriod = yearMonth.split("_")[1]; // ADD BY XINLEI XU 2025/04/17 会计年月
                            var planKey = "salesplanamountindspcrcy" + yearMonth;
                            var oppositeQty = aExcelSet[i][planKey] > 0 ? -Math.abs(aExcelSet[i][planKey]) : Math.abs(aExcelSet[i][planKey]); // Flip the sign of QTY

                            var oppositeAmount1 = aExcelSet[i][key] > 0 ? -Math.abs(aExcelSet[i][key]) : Math.abs(aExcelSet[i][key]); // Flip the sign of QTY

                            // MOD BEGIN BY XINLEI XU 2025/02/17
                            // var oppositeAmount2 = aExcelSet[i].materialcost2000_n > 0 ? -Math.abs(aExcelSet[i].materialcost2000_n) : Math.abs(aExcelSet[i].materialcost2000_n); // Flip the sign of QTY
                            // var oppositeAmount3 = aExcelSet[i].Manufacturingcost_n > 0 ? -Math.abs(aExcelSet[i].Manufacturingcost_n) : Math.abs(aExcelSet[i].Manufacturingcost_n); // Flip the sign of QTY
                            // 加工費 = 貢献利益（金額）- 売上総利益（金額）													
                            var oppositeAmount2 = parseFloat(aExcelSet[i]["ContributionProfitTotal" + yearMonth]) - parseFloat(aExcelSet[i]["GrossProfitTotal" + yearMonth]);
                            // 材料費 = 売上（金額）- 貢献利益（金額）
                            var oppositeAmount3 = parseFloat(aExcelSet[i]["SalesAmount" + yearMonth]) - parseFloat(aExcelSet[i]["ContributionProfitTotal" + yearMonth]);
                            oppositeAmount2 = oppositeAmount2.toFixed(2);
                            oppositeAmount3 = oppositeAmount3.toFixed(2);
                            // MOD END BY XINLEI XU 2025/02/17

                            var item = {
                                "YearMonth": yearPeriod, // yearMonth,
                                ...baseItem, // Spread the base item to include its properties
                                "GLAccount": aExcelSet[i].GLAccount1,
                                "GLAccountName": aExcelSet[i].GLAccountName1,
                                "Amount": oppositeAmount1, // Dynamic key assignment
                                "Currency": aExcelSet[i].DisplayCurrency1 ? aExcelSet[i].DisplayCurrency1 : "JPY",
                                "QTY": oppositeQty,
                                "Unit": aExcelSet[i].SalesPlanUnit,
                            };
                            aExcelSetBI.push(item);
                            var item1 = {
                                "YearMonth": yearPeriod, // yearMonth,
                                ...baseItem, // Spread the base item to include its properties
                                "GLAccount": aExcelSet[i].GLAccount2,
                                "GLAccountName": aExcelSet[i].GLAccountName2,
                                "Amount": oppositeAmount2, // Dynamic key assignment
                                "Currency": aExcelSet[i].currency ? aExcelSet[i].currency : "JPY", // aExcelSet[i].currency,
                                "QTY": "", // oppositeQty, // MOD BY XINLEI XU 2025/02/18
                                "Unit": "" // aExcelSet[i].SalesPlanUnit // MOD BY XINLEI XU 2025/02/18
                            };
                            aExcelSetBI.push(item1);
                            var item2 = {
                                "YearMonth": yearPeriod, // yearMonth,
                                ...baseItem, // Spread the base item to include its properties
                                "GLAccount": aExcelSet[i].GLAccount3,
                                "GLAccountName": aExcelSet[i].GLAccountName3,
                                "Amount": oppositeAmount3, // Dynamic key assignment
                                "Currency": aExcelSet[i].currency1 ? aExcelSet[i].currency1 : "JPY", // aExcelSet[i].currency1,
                                "QTY": "", // oppositeQty, // MOD BY XINLEI XU 2025/02/18
                                "Unit": "" // aExcelSet[i].SalesPlanUnit // MOD BY XINLEI XU 2025/02/18
                            };
                            aExcelSetBI.push(item2);
                        }
                    });

                }

                //console.log("aExcelSetBI", aExcelSetBI);

                var aExcelCol = [];
                var sType = "string";
                var oExcelCol = {
                    label: "Plan_Category",
                    type: sType,
                    property: "Plan_Category",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "Yearmonth",
                    type: sType,
                    property: "YearMonth",
                    width: 10
                };
                aExcelCol.push(oExcelCol);

                var oExcelCol = {
                    label: "CompanyCode",
                    type: sType,
                    property: "CompanyCode",
                    width: 10
                };
                aExcelCol.push(oExcelCol);

                // ADD BEGIN BY XINLEI XU 2025/02/17
                var oExcelCol = {
                    label: "Plant",
                    type: sType,
                    property: "Plant",
                    width: 4
                };
                aExcelCol.push(oExcelCol);

                var oExcelCol = {
                    label: "ProfitCenter",
                    type: sType,
                    property: "ProfitCenter",
                    width: 10
                };
                aExcelCol.push(oExcelCol);

                var oExcelCol = {
                    label: "Customer",
                    type: sType,
                    property: "Customer",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                // ADD END BY XINLEI XU 2025/02/17

                var oExcelCol = {
                    label: "Product",
                    type: sType,
                    property: "Product",
                    width: 12
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "MaterialGroup1",
                    type: sType,
                    property: "FirstSalesSpecProductGroup",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "MaterialGroup2",
                    type: sType,
                    property: "SecondSalesSpecProductGroup",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "MaterialGroup3",
                    type: sType,
                    property: "ThirdSalesSpecProductGroup",
                    width: 10
                };
                aExcelCol.push(oExcelCol);

                // ADD BEGIN BY XINLEI XU 2025/02/17
                var oExcelCol = {
                    label: "MaterialACCGroup",
                    type: sType,
                    property: "AccountDetnProductGroup",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                // ADD END BY XINLEI XU 2025/02/17

                var oExcelCol = {
                    label: "GL_Account",
                    type: sType,
                    property: "GLAccount",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "GL_Accounttext",
                    type: sType,
                    property: "GLAccountName",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "Amt_in_CC_Crcy",
                    type: sType,
                    property: "Amount",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "Currency",
                    type: sType,
                    property: "Currency",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "Quantity",
                    type: sType,
                    property: "QTY",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                var oExcelCol = {
                    label: "Unit",
                    type: sType,
                    property: "Unit",
                    width: 10
                };
                aExcelCol.push(oExcelCol);
                // 设置excel的相关属性
                var oSettings = {
                    workbook: {
                        columns: aExcelCol,
                        hierarchyLevel: "level"
                    },
                    dataSource: aExcelSetBI, // 传入参数，数据源
                    fileName: "Export_" + this._ResourceBundle.getText("title") + new Date().getTime() + ".xlsx" // 文件名，需要加上后缀
                };
                // 导出excel
                new Spreadsheet(oSettings).build();
            },
            _updateColumnHeaders: function (monthArray) {
                // 获取表格控件
                //  var oTable = this.getView().byId("idSmartFilterBar");  
                // var aColumns = oTable.getColumns(); 
                this._LocalData.setProperty("/ConditionRateValue01", "111");
                // 只更新前五列
                // for (var i = 0; i < 5; i++) {
                //     var column = aColumns[i]; 
                //     var label = column.getLabel();  


                //     // 动态构建标题："単価（YYYY年M月）"
                //    // var newLabel = "単価(" + monthArray[i] + ")";

                //     // 更新列标题
                //    // label.setText(newLabel);
                // }
            }


        });

    });

