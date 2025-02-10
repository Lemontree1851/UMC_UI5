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
            return "None";
        },

        formatResult: function (v) {
            if (v === "S") {
                return "Success";
            }
            if (v === "E") {
                return "Error";
            }
            return "";
        },

        // format Date
        formatDate: function (value) {
            if (value) {
                var oDateFormat = DateFormat.getTimeInstance({
                    pattern: "yyyy/MM/dd"
                });
                return oDateFormat.format(new Date(value));
            }
            return value;
        },

        odataDate: function (sDate) {
			var oDate = new Date(sDate);
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var sFormatDate = oDateFormat.format(oDate, false);
			return new Date(sFormatDate);
		},

        // format Time
        formatTime: function (value) {
            if (value) {
                var oTimeFormat = DateFormat.getTimeInstance({
                    pattern: "HH:mm:ss"
                });
                return oTimeFormat.format(new Date(value.ms));
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
        
        formatDecimal: function(value) {
            if (value) {
                return value ? parseFloat(value).toFixed(3) : "0.000";
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