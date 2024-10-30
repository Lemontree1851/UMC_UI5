sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/m/MessageBox"
], function (Component, MessageBox) {
    "use strict";

    return Component.extend("bc.zcommonconf.Component", {
        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            var sMessage = "为方便数据管理，请大家维护配置时遵循以下几点:"
                + "\n\n"
                + "1、命名规范：Z + 模块 + 三位流水。"
                + "\n\n"
                + "2、配置完成后，请仔细检查数据的正确性。"
                + "\n\n"
                + "谢谢大家配合。"
                + "\n\n"
                + "许鑫磊";
            MessageBox.information(sMessage);
        }
    });
});