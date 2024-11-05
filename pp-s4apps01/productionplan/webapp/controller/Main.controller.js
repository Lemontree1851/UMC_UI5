sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
],
    function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox) {
        "use strict";

        return Base.extend("pp.productionplan.controller.Main", {
            formatter: formatter,

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._BusyDialog = new BusyDialog();
                if (sap.ushell && sap.ushell.Container) {
                    this._UserInfo = sap.ushell.Container.getService("UserInfo");
                };
                this._LocalData.setProperty("/zdays", 30);

                this.onUpdateTitle();

            },


            onUpdateTitle: function (oEvent) {
                var oDateFrom = new Date();
                var oDatenum;
                var oDatefield;

                var oDatevalue = this.clone(oDateFrom);
                oDatevalue.setDate(oDatevalue.getDate() - 1);
                var that = this;

                for (var i = 0; i < 99; i++) {
                    oDatenum = i + 1;
                    if (oDatenum < 10) {
                        oDatenum = '00' + oDatenum;
                    };
                    if (oDatenum >= 10 && oDatenum < 100) {
                        oDatenum = '0' + oDatenum;
                    };

                    oDatenum = oDatenum.toString();
                    oDatefield = '/Date' + oDatenum;
                    oDatevalue.setDate(oDatevalue.getDate() + 1);
                    let weekday = oDatevalue.getDay();
                    let aWeekdays = ["日", "月", "火", "水", "木", "金", "土"];
                    that._LocalData.setProperty(oDatefield, (oDatevalue.getMonth() + 1) + '-' + oDatevalue.getDate() + aWeekdays[weekday]);
                }
            },

            clone: function (obj) {
                var o;
                if (obj.constructor == Object) {
                    o = new obj.constructor();
                } else {
                    o = new obj.constructor(obj.valueOf());
                }
                for (var key in obj) {
                    if (o[key] != obj[key]) {
                        if (typeof (obj[key]) == 'object') {
                            o[key] = this.clone(obj[key]);
                        } else {
                            o[key] = obj[key];
                        }
                    }
                }
                return o;
            },

            onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
                var mBindingParams = oEvent.getParameter("bindingParams");
                var newFilter;

                var oDays = this.byId("zdays").getValue();
                var oDaysFilter = new sap.ui.model.Filter("zday", sap.ui.model.FilterOperator.EQ, oDays);
                mBindingParams.filters.push(oDaysFilter);

                var sOption = this.byId("ch_bom").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("Expand", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
                sOption = this.byId("ch_plan").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("PlanCheck", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
                sOption = this.byId("ch_theory").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("Theory", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
                sOption = this.byId("ch_ecn").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("ECN", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
                sOption = this.byId("ch_wo").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("WO", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
                sOption = this.byId("ch_out").getSelected();
                if (sOption === true) {
                    newFilter = new sap.ui.model.Filter("exOut", sap.ui.model.FilterOperator.EQ, "X");
                    mBindingParams.filters.push(newFilter);
                };
            },

            onUITableRowsUpdated: function (oEvent) {
                var oTable = oEvent.getSource();
                var aRows = oTable.getRows();
                var sType = "";
                var sColor = "";
                let sNum = Number(this.byId("zdays").getValue());
                sNum = 16 + sNum;
                if (aRows && aRows.length > 0) {
                    for (var i = 0; i < aRows.length; i++) {
                        var c7Cell = aRows[i].getCells()[7];
                        if (c7Cell) {
                            sType = c7Cell.getText();
                            if (sType === "未処分") {
                                for (var j = 17; j < sNum; j++) {
                                    var cColor = aRows[i].getCells()[j];
                                    var oItems = cColor.getItems();
                                    var sColor = oItems[0].getText();
                                    if (cColor) {
                                        switch (sColor.charAt(0)) {
                                            case "R":
                                                cColor.addStyleClass("redCell");
                                                oItems[0].setText(sColor.slice(1));
                                                break;
                                            case "Y":
                                                cColor.addStyleClass("yellowCell");
                                                oItems[0].setText(sColor.slice(1));
                                                break;
                                            case "G":
                                                cColor.addStyleClass("greenCell");
                                                oItems[0].setText(sColor.slice(1));
                                                break;
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            },

            onEdit: function (oEvent) {
                //Auth Check
                let user = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
                let username = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();

                this.authCheck(user, username)

            },

            onInputChange: function (oEvent, sProperty) {
                var sPath = oEvent.getSource().getBindingContext().sPath;
                if (sPath) {
                    sPath = sPath + "/" + sProperty;
                    this._oDataModel.setProperty(sPath, oEvent.getParameter("value"));
                }
            },

            authCheck: function (user, username, sCheck) {
                var sCheck;
                var aPromise = [];
                var bEvent = "EDIT";
                aPromise.push(this.callAction("", "", bEvent, username));
                Promise.all(aPromise).then((oData) => {
                    oData.forEach((item) => {
                        sCheck = JSON.parse(item["processLogic"].Zzkey);
                        if (sCheck === "") {
                            MessageBox.error(this.getResourceBundle().getText("msg001"));
                            return;
                        } else {
                            var oTable = this.byId("ReportTable");
                            var aRows = oTable.getRows();
                            var sType = "";
                            let sNum = Number(this.byId("zdays").getValue());
                            sNum = 16 + sNum;
                            if (aRows && aRows.length > 0) {
                                for (var i = 0; i < aRows.length; i++) {
                                    var c7Cell = aRows[i].getCells()[7];
                                    if (c7Cell) {
                                        sType = c7Cell.getText();
                                        if (sType === "出荷計画" || sType === "計画手配") {
                                            for (var j = 17; j < sNum; j++) {
                                                var cEdit = aRows[i].getCells()[j];
                                                var oItems = cEdit.getItems();
                                                if (cEdit) {
                                                    oItems[1].setEditable(true);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };
                    });

                }).catch((error) => {
                    MessageBox.error(error.message);
                }).finally(() => {
                    this._BusyDialog.close();
                });

            },

            onRefresh: function (oEvent) {
                this.getView().byId("smartFilterBar").search();
            },

            onWeb1: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //MRP実行スケジュール
                switch (result) {
                    case "Dev":
                        window.open("https://my412552.s4hana.cloud.sap/ui#MRPRun-schedule?JobCatalogEntryName=SAP_SCM_MRP&/v4_JobRunList?sap-iapp-state=AS7Z8GAGA92B6PWBDCH0JWRN8PG5P17OQJ4XJDH8", "_blank");
                        break;
                };

            },

            onWeb2: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //製造指図と受注の割当
                switch (result) {
                    case "Dev":
                        window.open("https://s01-test.launchpad.cfapps.jp10.hana.ondemand.com/site/Dev#zmfgorderassignso-display?sap-ui-app-id-hint=saas_approuter_pp.zmfgorderassignso", "_blank");
                        break;
                };
            },

            onWeb3: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //製造指図発行
                switch (result) {
                    case "Dev":
                        window.open("https://my412552.s4hana.cloud.sap/ui#PlannedOrder-convertToProductionOrders?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb4: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //製造指図/計画手配監視
                switch (result) {
                    case "Dev":
                        window.open("https://my412552.s4hana.cloud.sap/ui#ProductionOrder-monitor?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb5: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //サマリBOM
                switch (result) {
                    case "Dev":
                        window.open("https://my412552.s4hana.cloud.sap/ui#MaterialBOM-summarizedBOM?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb5: function (oEvent) {
                let currentPath = window.location.pathname;
                let result = currentPath.substring(6, 9);
                //作業手順照会
                switch (result) {
                    case "Dev":
                        window.open("https://my412552.s4hana.cloud.sap/ui#ProductionRouting-display?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onPost: function (oEvent) {
                var that = this;
                var bEvent = "POST";
                let postDocs = this.preparePostBody();
                let sDays = this.byId("zdays").getValue();
                this._BusyDialog.open();
                var aPromise = [];
                aPromise.push(this.callAction(postDocs, sDays, bEvent, ""));

                Promise.all(aPromise).then((oData) => {
                    //refresh search
                    that.getView().byId("smartFilterBar").search();

                    oData.forEach((item) => {
                        let result = JSON.parse(item["processLogic"].Zzkey);
                        result.forEach(function (line) {
                            let sPath = that.getModel().createKey("/ProductionPlan", {
                                Plant: line.PLANT,
                                MRPResponsible: line.MRPRESPONSIBLE,
                                Product: line.PRODUCT,
                                Idnrk: line.IDNRK,
                                Stufe: line.STUFE,
                                Verid: line.VERID,
                                Mdv01: line.MDV01,
                                PlanType: line.PLANTYPE
                            });
                            that.getModel().setProperty(sPath + "/Status", line.STATUS);
                            that.getModel().setProperty(sPath + "/Message", line.MESSAGE);

                        });
                    });

                }).catch((error) => {
                    MessageBox.error(error.message);
                }).finally(() => {
                    this._BusyDialog.close();
                });
            },

            preparePostBody: function () {
                var that = this;
                var listItems = this.byId("ReportTable").getSelectedIndices(); // get selected rows
                var selectedRows = [];
                listItems.forEach((item) => {
                    var sPath = this.byId("ReportTable").getContextByIndex(item).getPath();
                    var oRow = this.getModel().getObject(sPath);
                    delete oRow.__metadata;
                    selectedRows.push(oRow);
                });

                let postDocs = [JSON.stringify(selectedRows)];
                return postDocs;

            },

            callAction: function (postData, sDays, bEvent, username) {
                var oModel = this._oDataModel;
                return new Promise(
                    function (resolve, reject) {
                        var mParameter = {
                            success: function (oData, response) {
                                resolve(oData);
                            },
                            error: function (oError) {
                                resolve(reject);
                            },
                            method: "POST",
                            urlParameters: {
                                Zzkey: postData,
                                Zday: sDays,
                                Event: bEvent,
                                Username: username
                            }
                        };

                        this.getModel().callFunction("/processLogic", mParameter);
                    }.bind(this)

                );
            }

        });
    });
