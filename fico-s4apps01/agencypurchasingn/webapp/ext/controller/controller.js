sap.ui.define([
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (BusyDialog, MessageBox, Fragment) {
    'use strict';

    var _myFunction, _myBusyDialog, _myMessageView, _myMessageDialog;
    return {
        init: function () {
            _myFunction = sap.ui.require("fico/agencypurchasingn/ext/controller/controller");
            _myBusyDialog = new BusyDialog();

        },

        onJournalentry: function (oEvent) {
            // _myFunction = sap.ui.require("fico/agencypurchasing/ext/controller/controller");

            var that = this;
            _myFunction._processRequest("POSTING", that);
        },

        _processRequest: function (bEvent, that) {
            var sTitle, items = [];
            var aContexts = that._controller.extensionAPI.getSelectedContexts();
            aContexts.forEach(element => {
                items.push(element.getObject(element.getPath()));
            });
            var oRequestData = {
                items: items,
                user: "P00001",
                username: "Xinlei Xu",
                datetime: _myFunction._getCurrentDateTime()
            }
            switch (bEvent) {

                case "POSTING":
                    sTitle = that.getModel("i18n").getResourceBundle().getText("Posting");
                    break;

                default:
                    break;
            }
            MessageBox.confirm(that.getModel("i18n").getResourceBundle().getText("confirmMessage", [sTitle]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        _myFunction._callOData(bEvent, oRequestData, that);
                    }
                },
                dependentOn: that.routing.getView()
            });
        },

        _callOData: function (bEvent, oRequestData, that) {
            var aPromise = [];
            aPromise.push(_myFunction._callODataAction(bEvent, oRequestData, that));
            try {
                    _myBusyDialog.open();
                Promise.all(aPromise).then((aContext) => {
                            _myBusyDialog.close();
                    var aMessageItems = [];
                    var aPrintRecords = [];
                    for (const activeContext of aContext) {
                        var boundContext = activeContext.getBoundContext();
                        var object = boundContext.getObject();
                        var result = JSON.parse(object.Zzkey);

                        // 获取选中的上下文
                        var aContexts = that._controller.extensionAPI.getSelectedContexts();

                        // 遍历 ITEMS 和选中的 aContexts 进行匹配
                        result.ITEMS.forEach((element, index) => {
                            if (aContexts[index]) { // 确保索引不越界
                                var sPath = aContexts[index].getPath(); // 获取选中条目的路径
                                // 设置对应的 Message 和 Status
                                aContexts[index].setProperty(sPath + "/message", element.MESSAGE)
                                aContexts[index].setProperty(sPath + "/accountingdocument1", element.ACCOUNTINGDOCUMENT1)
                                aContexts[index].setProperty(sPath + "/accountingdocument2", element.ACCOUNTINGDOCUMENT2)
                                // aContexts[index].setProperty(sPath + "/Status", element.STATUS)
                            }
                        });
                    }
                }).catch((error) => {
                    MessageBox.error(error);
                }).finally(() => {
                    _myBusyDialog.close();
                });
            } catch (error) {
                MessageBox.error(error);
                _myBusyDialog.close();
            }
        },

        _callODataAction: function (bEvent, aRequestData, that) {
            return new Promise((resolve, reject) => {
                var processLogic = that.getModel().bindContext("/Itemdata/com.sap.gateway.srvd.zui_agencypurchasing_o4.v0001.processLogic(...)");
                processLogic.setParameter("Event", bEvent);
                processLogic.setParameter("Zzkey", JSON.stringify(aRequestData));
                processLogic.setParameter("RecordUUID", "");
                processLogic.execute("$auto", false, null, /*bReplaceWithRVC*/false).then(() => {
                    resolve(processLogic);
                }).catch((error) => {
                    reject(error);
                });
            });
        },

        _getCurrentDateTime: function () {
            var date = new Date();
            var sTime = date.getUTCFullYear().toString() +
                _myFunction._pad2(date.getUTCMonth() + 1) +
                _myFunction._pad2(date.getUTCDate()) +
                _myFunction._pad2(date.getUTCHours()) +
                _myFunction._pad2(date.getUTCMinutes()) +
                _myFunction._pad2(date.getUTCSeconds());
            return sTime;
        },
        _pad2: function (n) {
            return parseInt(n) < 10 ? "0" + parseInt(n) : n;
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
        },

























    };
});
