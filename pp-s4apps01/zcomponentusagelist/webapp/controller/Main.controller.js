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
                NoDisplayColMfrpn: false
            });
        },

        onBeforeRebindTable: function (oEvent) {
            // 获取表格对象
            var oTable = this.byId("idTable");
            var oBinding = oEvent.getParameter("bindingParams");

            // 获取 NoDisplayColMfrpn 的值
            var oSmartFilterBar = this.byId("idSmartFilterBar");
            var sNoDisplayColMfrpn = oSmartFilterBar.getFilterData().NoDisplayColMfrpn;

            // 动态显示或隐藏列
            var oColumns = oTable.getColumns();
            var bShowColumn = sNoDisplayColMfrpn ? true : false; // 有值时显示，没值时隐藏

            oColumns.forEach(function (oColumn) {
                if (oColumn.getSortProperty() === "ProductManufacturerNumber") {
                    oColumn.setVisible(bShowColumn);
                }
            });
        }
    });
});

