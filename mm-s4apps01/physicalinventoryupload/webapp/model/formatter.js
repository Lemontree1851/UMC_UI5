sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";
    return {
        // format State
        formatState: function (value) {
            if (value === "S") {
                return "Success";
            }
            if (value === "E") {
                return "Error";
            }
            if (value === "W") {
                return "Warning";
            }
            return "None";
        },

        formatStateIcon: function (value) {
            if (value === "S") {
                return "sap-icon://status-positive";
            }
            if (value === "E") {
                return "sap-icon://status-negative";
            }
            if (value === "W") {
                return "sap-icon://status-critical";
            }
            return "sap-icon://status-inactive";
        },

        // format Date
        formatDate: function (value) {
            if (value) {
                var oDateFormat = DateFormat.getTimeInstance({
                    pattern: "yyyyMMdd"
                });
                return oDateFormat.format(new Date(value));
            }
            return value;
        },
        odataDate: function (sDate) {
            var oDate = new Date(sDate);
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "yyyyMMdd"
            });
            var sFormatDate = oDateFormat.format(oDate, false);
            return new Date(sFormatDate);
        },
        // 格式化时间
        formatTime: function (value) {
            if (value) {
                var oTimeFormat = DateFormat.getTimeInstance({
                    pattern: "HHmmss"  // 自定义时间格式
                });
                return oTimeFormat.format(new Date(value.ms || value)); // 确保传入值包含有效时间信息
            }
            return value;
        },

        // format Number, integer + thousandths
        formatNumber: function (n) {
            if (n) {
                var sign = "";
                if (typeof n === "string") {
                    var bNegative = n.endsWith("-");
                    if (bNegative) {
                        n = "-" + n.substring(0, n.length - 1);
                    }
                }
                var num = Number(n);
                if (num < 0) {
                    num = num * -1;
                    sign = "-";
                }
                var re = /\d{1,3}(?=(\d{3})+$)/g;
                var n1 = num.toString().replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
                    return s1.replace(re, "$&,") + s2;
                });
                if (sign === "-") {
                    n1 = sign + n1;
                }
                return n1;
            }
        },

        // format Float, two decimal + thousandths
        formatFloat: function (n, decimal) {
            if (n) {
                var sign = "";
                if (typeof n === "string") {
                    var bNegative = n.endsWith("-");
                    if (bNegative) {
                        n = "-" + n.substring(0, n.length - 1);
                    }
                }
                var num = Number(n).toFixed(decimal);
                if (num < 0) {
                    num = num.substring(1);
                    sign = "-";
                }
                var re = /\d{1,3}(?=(\d{3})+$)/g;
                var n1 = num.toString().replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
                    return s1.replace(re, "$&,") + s2;
                });
                if (sign === "-") {
                    n1 = sign + n1;
                }
                return n1;
            }
        }
    };
});