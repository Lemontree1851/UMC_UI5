sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("sd.zsalesdocumentlist.controller.Main", {
        onInit: function () {

        },

        onsMrilterBarInitialized: function (oEvent) {
            var oSmartFilterBar = oEvent.getSource();
            // 设置默认值
            oSmartFilterBar.setFilterData({
      
            });
        },

        // 勾选Checkbox的响应
        onSelect: function (oEvent) {
           
        },

        // 点执行按钮后的响应
        onSearch: function (oEvent) {
           
        },

        // 点执行按钮后的响应
        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            // var oTable = this.byId("idTable");
            // var oBinding = oEvent.getParameter("bindingParams");

            // // 获取 NoDisplayColMfrpn 的值
            // var oSmartFilterBar = this.byId("idSmartFilterBar");
            // var sNoDisplayColMfrpn = oSmartFilterBar.getFilterData().NoDisplayColMfrpn;

            // // 动态显示或隐藏列
            // var oColumns = oTable.getColumns();
            // var bShowColumn = sNoDisplayColMfrpn ? true : false; // 有值时显示，没值时隐藏

            // oColumns.forEach(function (oColumn) {
            //     if (oColumn.getSortProperty() === "ProductManufacturerNumber") {
            //         oColumn.setVisible(bShowColumn);
            //     }
            // });

            var filters = oEvent.getParameters().bindingParams.filters;
            if(!filters){
                filters =[];
            }

            var sIndicator1 = this.byId("idCB1").getSelected();
            var sIndicator2 = this.byId("idCB2").getSelected();
            var sIndicator3 = this.byId("idCB3").getSelected();
            var sIndicator4 = this.byId("idCB4").getSelected();
            var sIndicator5 = this.byId("idCB5").getSelected();
            var sIndicator6 = this.byId("idCB6").getSelected();

            if (sIndicator1 === true) { 
                var oIndicator1Filter = new sap.ui.model.Filter({
                    path: "Indicator1",
                    operator: "EQ",
                    value1: sIndicator1
                });
                filters.push(oIndicator1Filter);
            }

            if (sIndicator2 === true) { 
                var oIndicator2Filter = new sap.ui.model.Filter({
                    path: "Indicator2",
                    operator: "EQ",
                    value1: sIndicator2
                });
                filters.push(oIndicator2Filter);
            }

            if (sIndicator3 === true) { 
                var oIndicator3Filter = new sap.ui.model.Filter({
                    path: "Indicator3",
                    operator: "EQ",
                    value1: sIndicator3
                });
                filters.push(oIndicator3Filter);
            }

            if (sIndicator4 === true) { 
                var oIndicator4Filter = new sap.ui.model.Filter({
                    path: "Indicator4",
                    operator: "EQ",
                    value1: sIndicator4
                });
                filters.push(oIndicator4Filter);
            }

            if (sIndicator5 === true) { 
                var oIndicator5Filter = new sap.ui.model.Filter({
                    path: "Indicator5",
                    operator: "EQ",
                    value1: sIndicator5
                });
                filters.push(oIndicator5Filter);
            }

            if (sIndicator6 === true) { 
                var oIndicator6Filter = new sap.ui.model.Filter({
                    path: "Indicator6",
                    operator: "EQ",
                    value1: sIndicator6
                });
                filters.push(oIndicator6Filter);
            }
        }
    });
});

