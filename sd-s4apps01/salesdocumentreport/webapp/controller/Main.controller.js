sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/BusyDialog",
    "sap/m/MessageBox",
],
    function (Controller, Filter, FilterOperator, BusyDialog, MessageBox) {
        "use strict";

        return Controller.extend("sd.salesdocumentreport.controller.Main", {

            onInit: function () {
                this._LocalData = this.getOwnerComponent().getModel("local");
                this._oDataModel = this.getOwnerComponent().getModel();
                this._updateColumnHeaders();

            },

            onBeforeRebindTable: function (oEvent, arg1, arg2, arg3, arg4) {
                var mBindingParams = oEvent.getParameter("bindingParams");

                var newfilter;


                var oSelect = this.byId("idplantype"); // 通过ID获取Select控件
                var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                newfilter = new sap.ui.model.Filter("plantype", sap.ui.model.FilterOperator.EQ, selectedKey);
                mBindingParams.filters.push(newfilter);

                var oSelect = this.byId("idMonat"); // 通过ID获取Select控件
                var selectedKey = oSelect.getSelectedKey();  // 获取选中的key值
                newfilter = new sap.ui.model.Filter("YearDate", sap.ui.model.FilterOperator.EQ, selectedKey);
                mBindingParams.filters.push(newfilter);

            },

            onMonthChange: function (oEvent) {
                // 获取选择的月份
                var selectedMonth = oEvent.getParameter("selectedItem").getKey();  // 
            
                // 获取当前年份
                var currentDate = new Date();
                var currentYear = currentDate.getFullYear();
                var monthArray = [];
            
                // 根据选择的月份计算当前年份和前五个月
                for (var i = 0; i < 5; i++) {
                    var newMonth = parseInt(selectedMonth) - i; // 计算新月份
                    var year = currentYear;
            
                    // 如果月份小于1，切换到上一年
                    if (newMonth < 1) {
                        newMonth = 12 + newMonth;  // 处理月份跨年
                        year = currentYear - 1;    // 切换到上一年
                    }
            
                    // 格式化为 "YYYY年M月"
                    var formattedMonth = year + "年" + (newMonth < 10 ? "0" + newMonth : newMonth) + "月";
                    monthArray.push(formattedMonth);  // 将格式化的月份添加到数组
                }
            
                // 调用方法更新列标题
                this._updateColumnHeaders(monthArray);
            },
            
            _updateColumnHeaders: function (monthArray) {
                // 获取表格控件
              //  var oTable = this.getView().byId("idSmartFilterBar");  
               // var aColumns = oTable.getColumns(); 
                this._LocalData.setProperty("/ConditionRateValue01", "111");
                // 只更新前五列
                // for (var i = 0; i < 5; i++) {
                //     var column = aColumns[i]; 
                //     var label = column.getLabel();  
             
                    
                //     // 动态构建标题："単価（YYYY年M月）"
                //    // var newLabel = "単価(" + monthArray[i] + ")";
            
                //     // 更新列标题
                //    // label.setText(newLabel);
                // }
            }
            
            
        });

    });

