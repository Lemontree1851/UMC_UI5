sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";
    return {
        setState: function (v) {
            if (v === "S") {
                return "Success";
            }
            if (v === "E") {
                return "Error";
            }
            if (v === "W") {
                return "Warning";
            }
            return "None";
        },

        setStateIcon: function (v) {
            if (v === "S") {
                return "sap-icon://status-positive";
            }
            if (v === "E") {
                return "sap-icon://status-negative";
            }
            if (v === "W") {
                return "sap-icon://status-critical";
            }
            return "sap-icon://status-inactive";
        },

        setResult: function (v) {
            if (v === "S") {
                return "成功";
            }
            if (v === "E") {
                return "失敗";
            }
            return "";
        },

        setRate: function (v) {
            return v + "%";
        },

        // 0000/00/00
        date: function (value) {
            if (value) {
                var oDateFormat = DateFormat.getDateTimeInstance({
                    pattern: "yyyy/MM/dd"
                });
                return oDateFormat.format(new Date(value));
            } else {
                return value;
            }
        },

        // 00:00:00
        time: function (value) {
            if (value) {
                var timeFormat = DateFormat.getTimeInstance({
                    pattern: "HH:mm:ss"
                });
                if (value.ms !== 0) {
                    return timeFormat.format(new Date(value.ms), true);
                }
                return null;
            } else {
                return value;
            }
        },

        odataDate: function (v) {
            var deliveryDate = new Date(v);
            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd"
            });
            var deliveryDateString = oDateFormat.format(deliveryDate, false);
            return new Date(deliveryDateString);
        },

        stringToDate: function (value) {
            if (value) {
                if (Number(value) === 0) {
                    return "";
                } else {
                    return value.substring(0, 4) + "/" + value.substring(4, 6) + "/" + value.substring(6);
                }
            }
            return value;
        },

        //如果字符全部为0 则显示空白
        allZeroToBlank: function (value) {
            if (value) {
                if (Number(value) === 0) {
                    return "";
                }
                return value;
            }
            return value;
        },
        convertLocalDateToUTCDate: function (localDate = new Date()) {
            // 获取当前时区偏移（分钟）
            let timezoneOffset = localDate.getTimezoneOffset(); 
            // 调整时区偏移，将本地时间转换为 UTC 时间（时间不变）
            let utcDate = new Date(localDate.getTime() - timezoneOffset * 60000);
            return utcDate;
        }

    };
});