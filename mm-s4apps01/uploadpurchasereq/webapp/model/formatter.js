sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/m/upload/UploadSetwithTable"
], function (DateFormat, UploadSetwithTable) {
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
            if (v === "W") {
                return "警告";
            }
            return "";
        },

        setRate: function (v) {
            return v + "%";
        },

        // 0000/00/00
        date: function (value) {
            if (value) {
                let localDate = new Date(value);
                if (!isNaN(localDate.getTime()) && value.ms) {
                    var oDateFormat = DateFormat.getDateTimeInstance({
                        pattern: "yyyy/MM/dd"
                    });
                    return oDateFormat.format(new Date(value));
                } else {
                    if (value.length === 8) {
                        return value.substring(0, 4) + "/" + value.substring(4, 6) + "/" + value.substring(6);
                    }
                }
                return value;
            }
        },

        // 00:00:00
        time: function (value) {
            if (value) {
                let localDate = new Date(value);
                if (!isNaN(localDate.getTime()) && value.ms) {
                    var timeFormat = DateFormat.getTimeInstance({
                        pattern: "HH:mm:ss"
                    });
                    if (value.ms !== 0) {
                        return timeFormat.format(new Date(value.ms), true);
                    }
                    return null;
                } else {
                    if (value.length === 6) {
                        return value.substring(0, 2) + ":" + value.substring(2, 4) + ":" + value.substring(4);
                    }
                }
                return value;
            }
        },

        odataDate: function (v) {
            var deliveryDate = new Date(v);
            if (isNaN(date.getTime())) {
                return "";
            }
            var oDateFormat = DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd"
            });
            var deliveryDateString = oDateFormat.format(deliveryDate, false);
            return new deliveryDateString;
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
        },
        convertISOString: function (v) {
            let localDate = new Date(v);
            if (!isNaN(localDate.getTime)) {
                return localDate.toISOString().slice(0, 10);
            } else {
                return v;
            }
        },
        additionalText: function (key, text) {
            if (text) {
                return `${text} (${key})`;
            }
            return key;
        },
        ToggleEditable: function (editable, approveStatus, isApprove) {
            // 暂时不根据审批状态限制编辑
            //editable="{parts:['local>/objectPageEditable','ApproveStatus','IsApprove'], formatter:'.formatter.ToggleEditable'}"
            // if( editable && ( approveStatus == '1' || (approveStatus == '3' && isApprove == '2') )) {
            //     return true;
            // }
            // return false;
            return editable;
        },

        // ADD BEGIN BY XINLEI XU 2025/02/20
        getIconSrc: function (mediaType, thumbnailUrl) {
            return UploadSetwithTable.getIconForFileType(mediaType, thumbnailUrl);
        },
        getFileSizeWithUnits: function (iFileSize) {
            return UploadSetwithTable.getFileSizeWithUnits(iFileSize);
        }
        // ADD END BY XINLEI XU 2025/02/20
    };
});