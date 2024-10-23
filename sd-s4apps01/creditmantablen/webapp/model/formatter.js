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
		}
	};
});