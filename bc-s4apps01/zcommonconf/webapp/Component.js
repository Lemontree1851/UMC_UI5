sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/m/MessageBox",
    "bc/zcommonconf/ext/controller/ListReportExt"
], function (Component, MessageBox, ListReportExt) {
    "use strict";

    return Component.extend("bc.zcommonconf.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            // var sMessage = "为方便数据管理，请大家维护配置时遵循以下几点:"
            //     + "\n\n"
            //     + "1、请先维护共通配置流水表：https://docs.qq.com/sheet/DQWlGc1BSc1NLRnFi?tab=000001，点击确认自动跳转。"
            //     + "\n\n"
            //     + "2、命名规范：Z + 模块 + 三位流水。"
            //     + "\n\n"
            //     + "3、配置完成后，请仔细检查数据的正确性。"
            //     + "\n\n"
            //     + "谢谢大家配合。"
            //     + "\n\n"
            //     + "许鑫磊";
            // MessageBox.information(sMessage, {
            //     actions: [MessageBox.Action.OK],
            //     emphasizedAction: MessageBox.Action.OK,
            //     onClose: function (sAction) {
            //         window.open("https://docs.qq.com/sheet/DQWlGc1BSc1NLRnFi?tab=000001");
            //     }
            // });

            this.ListReportExt.getAuthorityData(this.oModels);
        }
    });
});