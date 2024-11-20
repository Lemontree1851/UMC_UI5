sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("pp.zcomponentusagelist.controller.Main", {
        onInit: function () {

        },

        onsMrilterBarInitialized: function (oEvent) {
            var oSmartFilterBar = oEvent.getSource();
            // //设置默认值
            oSmartFilterBar.setFilterData({
                NoDisplayNonProduct: false,
                DisplayPurchasingInfo: false
            });
        },

        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            var oTable = this.byId("idTable");

            // 获取 DisplayPurchasingInfo 的值
            // var oSmartFilterBar = this.byId("idSmartFilterBar");
            // var sDisplayPurchasingInfo = oSmartFilterBar.getFilterData().DisplayPurchasingInfo;
            var sDisplayPurchasingInfo = this.byId("idCB2").getSelected();

            // 动态显示或隐藏列
            var oColumns = oTable.getColumns();
            var bShowColumn = sDisplayPurchasingInfo === true ? true : false; // 有值时显示，没值时隐藏

            oColumns.forEach(function (oColumn) {
                if (oColumn.getSortProperty() === "SupplierMaterialNumber" || oColumn.getSortProperty() === "ProductManufacturerNumber") {
                    oColumn.setVisible(bShowColumn);
                }
            });

            // 根据选择框，添加过滤条件传值到后端
            var filters = oEvent.getParameters().bindingParams.filters;
            if(!filters){
                filters =[];
            }

            var sNoDisplayNonProduct = this.byId("idCB1").getSelected();

            if (sNoDisplayNonProduct === true) { 
                var oIndicator1Filter = new sap.ui.model.Filter({
                    path: "NoDisplayNonProduct",
                    operator: "EQ",
                    value1: sNoDisplayNonProduct
                });
                filters.push(oIndicator1Filter);
            }
        }
    });
});
