sap.ui.define([
    "sap/fe/core/AppComponent",
    "sap/m/MessageBox",
    "bc/zdtimpconf/ext/controller/ListReportExt"
], function (Component, MessageBox, ListReportExt) {
    "use strict";

    return Component.extend("bc.zdtimpconf.Component", {

        ListReportExt: ListReportExt,

        metadata: {
            manifest: "json"
        },

        onAfterRendering: function () {
            var sMessage = "为方便数据管理，请大家遵循以下规范:"
                + "\n\n"
                + "1、批导对象，以 ZDATAIMPORT_ 开头。"
                + "\n\n"
                + "2、上传模版，以 ZUPLOAD_ 开头，Function 信息填 - 。"
                + "\n\n"
                + "3、下载模版，以 ZDOWNLOAD_ 开头，Function 信息填 - 。"
                + "\n\n"
                + "谢谢大家配合。"
                + "\n\n"
                + "许鑫磊";
            MessageBox.information(sMessage);
            
            this.ListReportExt.getAuthorityData(this.oModels);
        }
    });
});