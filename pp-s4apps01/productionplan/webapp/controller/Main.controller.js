sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/table/Column",
    "sap/m/plugins/CellSelector"
], function (Base, formatter, Filter, FilterOperator, BusyDialog, MessageBox, Column, CellSelector) {
    "use strict";

    let oCellSelector;
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

            if (window.isSecureContext) {
                const oTable = this.byId("ReportTable");
                oCellSelector = new CellSelector();
                oTable.addDependent(oCellSelector)
            }
        },

        /**
         * 粘贴功能
         * ADD BY XINLEI XU 2024/11/29
         * @param {*} oEvent 
         */
        onPaste: function (oEvent) {
            var that = this;
            function handlePaste(that, aData, oCellInfo) {
                var oTable = that.byId("ReportTable");
                var rowIndexFrom = oCellInfo.from.rowIndex;
                var rowIndexTo = oCellInfo.to.rowIndex;
                var colIndexFrom = oCellInfo.from.colIndex;
                var colIndexTo = oCellInfo.to.colIndex;
                var iRowNum = -1;
                for (var index = rowIndexFrom; index <= rowIndexTo; index++) {
                    var iColNum1 = 0,
                        iColNum2 = 0;
                    var sRowPath = oTable.getContextByIndex(index).getPath();
                    var sType = that._oDataModel.getProperty(sRowPath + "/PlanType");
                    iRowNum += 1;
                    // 行可编辑
                    if (sType === "I" || sType === "P") {
                        if (aData[iRowNum]) {
                            var object = aData[iRowNum];
                            for (const key in object) {
                                if (Object.prototype.hasOwnProperty.call(object, key)) {
                                    const value = object[key];
                                    for (var m = 0; m < oTable.getColumns().length; m++) {
                                        const oColumn = oTable.getColumns()[m];
                                        if (oColumn.getVisible()) {
                                            // 可见列数
                                            iColNum1 += 1;
                                            var sFieldPath = oTable.getColumns()[iColNum1 + iColNum2].getSortProperty();
                                            if (iColNum1 >= colIndexFrom && iColNum1 <= colIndexTo) {
                                                that._oDataModel.setProperty(sRowPath + "/" + sFieldPath, value);
                                                break;
                                            } else if (iColNum1 > colIndexTo) {
                                                return;
                                            }
                                        } else {
                                            // 不可见列数
                                            iColNum2 += 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const aData = oEvent.getParameter("data");
            const oRange = oCellSelector.getSelectionRange();
            if (oRange) {
                handlePaste(that, aData, oRange);
            }
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

            var oModel = this.getOwnerComponent().getModel();
            if (oModel.hasPendingChanges()) {
                // 重置未保存的更改
                oModel.resetChanges();
            }
        },

        onSearch: function () {
            var that = this;
            var oFilters = this.byId("smartFilterBar").getFilters();
            var aFilters = oFilters[0].aFilters;
            var oDays = this.byId("zdays").getValue();
            aFilters.push(new Filter("zday", FilterOperator.EQ, oDays));
            var sOption = this.byId("ch_bom").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("Expand", FilterOperator.EQ, "X"));
            };
            sOption = this.byId("ch_plan").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("PlanCheck", FilterOperator.EQ, "X"));
            };
            sOption = this.byId("ch_theory").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("Theory", FilterOperator.EQ, "X"));
            };
            sOption = this.byId("ch_ecn").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("ECN", FilterOperator.EQ, "X"));
            };
            sOption = this.byId("ch_wo").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("WO", FilterOperator.EQ, "X"));
            };
            sOption = this.byId("ch_out").getSelected();
            if (sOption === true) {
                aFilters.push(new Filter("exOut", FilterOperator.EQ, "X"));
            };
            var oModel = this.getOwnerComponent().getModel();
            if (oModel.hasPendingChanges()) {
                // 重置未保存的更改
                oModel.resetChanges();
            }
        },

        onUITableRowsUpdated: function (oEvent) {
            let oTable = oEvent.getSource();
            let aRows = oTable.getRows();
            let sType = "";
            let sSobmx = "";
            let sColor = "";

            let s1 = "";
            let sNum = Number(this.byId("zdays").getValue());
            sNum = 17 + sNum;
            aRows.forEach(function (oRow, index) {
                let c7Cell = oRow.getCells()[8];
                sType = c7Cell.getText();
                if (sType === 'I') {
                    $("#" + oRow.getId()).css("background-color", "#FFFDBF");
                } else if (sType === 'O') {
                    $("#" + oRow.getId()).css("background-color", "#C6F9C1");
                } else if (sType === 'P') {
                    let c6Cell = oRow.getCells()[7];
                    sSobmx = c6Cell.getText();
                    if (sSobmx === '52') {
                        $("#" + oRow.getId()).css("background-color", "#fc794a");
                    } else {
                        $("#" + oRow.getId()).css("background-color", "");
                    }
                } else {
                    $("#" + oRow.getId()).css("background-color", "");
                };


                if (sType === "W") {
                    for (let j = 19; j < sNum; j++) {
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
                            default:
                                $("#" + CellId).parent().parent().css("background-color", "");
                                break;
                        }

                    }
                } else {
                    for (let j = 19; j < sNum; j++) {
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
                let sNum = Number(this.byId("zdays").getValue());
                sNum = 18 + sNum;
                var aRows = oTable.getRows();
                var sType = "";
                if (aRows && aRows.length > 0) {
                    for (var i = 0; i < aRows.length; i++) {
                        var c7Cell = aRows[i].getCells()[8];
                        if (c7Cell) {
                            sType = c7Cell.getText();
                            if (sType === "I" || sType === "P") {
                                for (var j = 19; j < sNum; j++) {
                                    var cEdit = aRows[i].getCells()[j];
                                    var oItems = cEdit.getItems();
                                    oItems[1].setEditable(true);
                                }
                            }
                        }
                    }
                };
                oTable.attachEvent("rowsUpdated", function () {
                    if (aRows && aRows.length > 0) {
                        for (var i = 0; i < aRows.length; i++) {
                            var c7Cell = aRows[i].getCells()[8];
                            if (c7Cell) {
                                var sType = c7Cell.getText();
                                if (sType === "I" || sType === "P") {
                                    for (var j = 19; j < sNum; j++) {
                                        var cEdit = aRows[i].getCells()[j];
                                        if (cEdit && cEdit.getItems) {
                                            var oItems = cEdit.getItems();
                                            if (oItems && oItems[1]) {
                                                oItems[1].setEditable(true); // 动态设置编辑状态
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
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
                        let sNum = Number(this.byId("zdays").getValue());
                        sNum = 18 + sNum;
                        var aRows = oTable.getRows();
                        var sType = "";
                        if (aRows && aRows.length > 0) {
                            for (var i = 0; i < aRows.length; i++) {
                                var c7Cell = aRows[i].getCells()[8];
                                if (c7Cell) {
                                    sType = c7Cell.getText();
                                    if (sType === "I" || sType === "P") {
                                        for (var j = 19; j < sNum; j++) {
                                            var cEdit = aRows[i].getCells()[j];
                                            var oItems = cEdit.getItems();
                                            if (cEdit) {
                                                oItems[1].setEditable(true);
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        oTable.attachEvent("rowsUpdated", function () {
                            var aRows = oTable.getRows();
                            if (aRows && aRows.length > 0) {
                                for (var i = 0; i < aRows.length; i++) {
                                    var c7Cell = aRows[i].getCells()[8];
                                    if (c7Cell) {
                                        var sType = c7Cell.getText();
                                        if (sType === "I" || sType === "P") {
                                            for (var j = 19; j < sNum; j++) {
                                                var cEdit = aRows[i].getCells()[j];
                                                if (cEdit && cEdit.getItems) {
                                                    var oItems = cEdit.getItems();
                                                    if (oItems && oItems[1]) {
                                                        oItems[1].setEditable(true); // 动态设置编辑状态
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    };
                });

            }).catch((error) => {
                MessageBox.error(error.message);
            }).finally(() => {
                this._BusyDialog.close();
            });

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


    });
});
