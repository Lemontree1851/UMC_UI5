sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat"
], function (DateFormat, NumberFormat) {
	"use strict";
	return {
		odataDate: function (sDate) {
			var oDate = new Date(sDate);
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var sFormatDate = oDateFormat.format(oDate, false);
			return new Date(sFormatDate);
		},
		date: function (value) {
			if (value) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyyMMdd"
				});
				return oDateFormat.format(new Date(value));
			}
			return value;
		},
		formatDate: function (oDate) {
			if (oDate) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyyMMdd"
				});
				return oDateFormat.format(oDate);
			}
		},
		formatDateWithSlash: function (oDate) {
			if (oDate) {
				var oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
				return oDateFormat.format(oDate);
			}
		},
		formatFloatWithoutDig: function (number) {
			var str = (number) ? number.toString() : "0";
			var value = Number(str).toFixed(0);
			var result = NumberFormat.getFloatInstance().format(value);
			if (result === "0")
				return "";
			else
				return result;
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
			} else {
				return n;
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
			} else {
				return n;
			}
		}
	};
});