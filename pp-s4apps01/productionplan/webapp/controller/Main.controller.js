sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/table/Column",
],
    function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox, Column) {
        "use strict";

        return Base.extend("pp.productionplan.controller.Main", {
            formatter: formatter,

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._oDataModel.setRefreshAfterChange(false);

                this._BusyDialog = new BusyDialog();
                if (sap.ushell && sap.ushell.Container) {
                    this._UserInfo = sap.ushell.Container.getService("UserInfo").getUser();
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
                let oTable = oEvent.getSource();
                let aRows = oTable.getRows();
                let sType = "";
                let sColor = "";

                let s1 = "";
                let sNum = Number(this.byId("zdays").getValue());
                sNum = 16 + sNum;
                aRows.forEach(function (oRow, index) {
                    let c7Cell = oRow.getCells()[7];
                    sType = c7Cell.getText();
                    if (sType === "W") {
                        for (let j = 18; j < sNum; j++) {
                            let cColor = oRow.getCells()[j];
                            let CellId = cColor.getId();
                            let oItems = cColor.getItems();
                            let sValue = oItems[1].getValue();
                            sColor = sValue;
                            s1 = sValue.charAt(0);
                            switch (s1) {
                                case "R":
                                    oItems[0].setText(sColor.slice(1));
                                    $("#" + CellId).parent().parent().css("background-color", "#ff0000");
                                    break;
                                case "Y":
                                    oItems[0].setText(sColor.slice(1));
                                    $("#" + CellId).parent().parent().css("background-color", "#FFFF00");
                                    break;
                                case "G":
                                    oItems[0].setText(sColor.slice(1));
                                    $("#" + CellId).parent().parent().css("background-color", "#008000");
                                    break;
                            }

                        }
                    } else {
                        for (let j = 18; j < sNum; j++) {
                            let cColor = oRow.getCells()[j];
                            let CellId = cColor.getId();
                            $("#" + CellId).parent().parent().css("background-color", "");

                        }
                    }
                });
            },

            onEdit: function (oEvent) {
                //Auth Check
                if (sap.ushell && sap.ushell.Container) {
                    let user = this._UserInfo.getEmail() === undefined ? "" : this._UserInfo.getEmail();
                    let username = this._UserInfo.getFullName() === undefined ? "" : this._UserInfo.getFullName();

                    this.authCheck(user, username)
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
                                if (sType === "I" || sType === "P") {
                                    for (var j = 18; j < sNum; j++) {
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
                aPromise.push(this.callAction("", bEvent, username));
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
                            sNum = 17 + sNum;
                            if (aRows && aRows.length > 0) {
                                for (var i = 0; i < aRows.length; i++) {
                                    var c7Cell = aRows[i].getCells()[7];
                                    if (c7Cell) {
                                        sType = c7Cell.getText();
                                        if (sType === "I" || sType === "P") {
                                            for (var j = 18; j < sNum; j++) {
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
                this._oDataModel.refresh(true);
                //刷新没有清空输入值有change的字段，手动清空
                this.resetInput();

            },

            onWeb1: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //MRP実行スケジュール
                switch (result) {
                    case "https://s01-test":
                        window.open("https://my412552.s4hana.cloud.sap/ui#MRPRun-schedule?JobCatalogEntryName=SAP_SCM_MRP&/v4_JobRunList?sap-iapp-state=AS7Z8GAGA92B6PWBDCH0JWRN8PG5P17OQJ4XJDH8", "_blank");
                        break;
                };

            },

            onWeb2: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //製造指図と受注の割当
                switch (result) {
                    case "https://s01-test":
                        window.open("https://s01-test.launchpad.cfapps.jp10.hana.ondemand.com/site/Dev#zmfgorderassignso-display?sap-ui-app-id-hint=saas_approuter_pp.zmfgorderassignso", "_blank");
                        break;
                };
            },

            onWeb3: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //製造指図発行
                switch (result) {
                    case "https://s01-test":
                        window.open("https://my412552.s4hana.cloud.sap/ui#PlannedOrder-convertToProductionOrders?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb4: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //製造指図/計画手配監視
                switch (result) {
                    case "https://s01-test":
                        window.open("https://my412552.s4hana.cloud.sap/ui#ProductionOrder-monitor?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb5: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //サマリBOM
                switch (result) {
                    case "https://s01-test":
                        window.open("https://my412552.s4hana.cloud.sap/ui#MaterialBOM-summarizedBOM?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onWeb6: function (oEvent) {
                let currentPath = window.location.href;
                let parts = currentPath.split(".");
                //let part = parts[0];
                let result = parts[0];
                //作業手順照会
                switch (result) {
                    case "https://s01-test":
                        window.open("https://my412552.s4hana.cloud.sap/ui#ProductionRouting-display?sap-ui-tech-hint=GUI", "_blank");
                        break;
                };
            },

            onPost: function (oEvent) {
                var that = this;
                var bEvent = "POST";
                let postDocs = this.preparePostBody();
                this._BusyDialog.open();
                var aPromise = [];
                aPromise.push(this.callAction(postDocs, bEvent, ""));

                Promise.all(aPromise).then((oData) => {
                    this._oDataModel.refresh(true);
                    //刷新没有清空输入值有change的字段，手动清空
                    this.resetInput();

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

            callAction: function (postData, bEvent, username) {
                var sDays = this.byId("zdays").getValue();
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
                                Zdays: sDays,
                                Event: bEvent,
                                Username: username
                            }
                        };

                        this.getModel().callFunction("/processLogic", mParameter);
                    }.bind(this)

                );
            },
            resetInput: function () {
                let oTable = this.byId("ReportTable");
                let aColumns = oTable.getColumns();
                let aRows = oTable.getRows();
                let sType = "";
                let sNum = Number(this.byId("zdays").getValue());
                sNum = 17 + sNum;
                if (aRows && aRows.length > 0) {
                    for (let i = 0; i < aRows.length; i++) {
                        let c7Cell = aRows[i].getCells()[7];
                        if (c7Cell) {
                            sType = c7Cell.getText();
                            if (sType === "I" || sType === "P") {
                                for (let j = 21; j < sNum; j++) {
                                    let oFirstColumn = aColumns[j];
                                    let sColumnText = oFirstColumn.getLabel().getText();
                                    let sDay = sColumnText.slice(-1);
                                    if (sDay === "日" || sDay === "土") {
                                        let idx = j - 3;
                                        //如果是天数的第一列，不要清空，因为是总和
                                        if (idx !== 18) {
                                            let cEdit = aRows[i].getCells()[idx];
                                            let oItems = cEdit.getItems();
                                            if (cEdit) {
                                                oItems[0].setText("");
                                                oItems[1].setValue("");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            },


        });
    });
