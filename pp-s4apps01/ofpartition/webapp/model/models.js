sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
function (JSONModel, Device) {
    "use strict";

    return {
        /**
         * Provides runtime info for the device the UI5 app is running on as JSONModel
         */
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        // 初始化本地数据集
		_initialLocalData : function() {
			var localData = {
				busy: false,
				hasUIChanges : false,
				errors: "",
				excelSet:[],
				OFPartition: [],
				OFPartitionTemp:[],
				upload: [{}],
				isRecordCheckSuccessed: false
			};
			return localData;
		},
		// 创建本地模型
		createLocalModel : function() {
			var oModel = new JSONModel(this._initialLocalData());
			oModel.setSizeLimit(9999);
			return oModel;
		},

    };

});