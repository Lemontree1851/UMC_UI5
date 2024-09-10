sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    function (Controller) {
        "use strict";

        return Controller.extend("sd.batchcreationdn.controller.Main", {
            onInit: function () {

            },

            onDNButtonPress: function (oEvent) {
                let aSelectedData = this.getSelectedRows(oEvent);

                var oView = this.getView(),
                    oModel = oView.getModel(),
                    oRatingForm = oView.byId("idSmartTable"),
                    aDeferredGroups = oModel.getDeferredGroups();
                aDeferredGroups = aDeferredGroups.concat(["myId"]);
                oModel.setDeferredGroups(aDeferredGroups);

                aSelectedData.forEach(function (line, index) {
                    oModel.callFunction("/createdeliveryorder", {
                        method: "POST",
                        error: function () {
                            oModel.resetChanges([oRatingForm.getBindingContext().getPath()]);
                        },
                        groupId: "myId",//如果设置groupid，会多条一起进入action
                        // changeSetId: index,
                        //建议只传输前端修改的参数，其他字段从后端获取
                        urlParameters: {
                            SalesOrder: line.SalesOrder,
                            SalesOrderItem: line.SalesOrderItem,
                            DeliveryType: line.DeliveryType,
                            ShippingType: line.ShippingType,
                            ShipToParty: line.ShipToParty,
                            CurrDeliveryQty: line.CurrDeliveryQty,
                            CurrDeliverQtyUnit: line.CurrDeliverQtyUnit,
                            StorageLocation: line.StorageLocation,
                        }
                    });
                });
                oModel.submitChanges({ groupId: "myId" });
                // oModel.submitChanges();
            },
            getSelectedRows: function (oEvent) {
                // 获取按钮的上下文
                var oButton = oEvent.getSource();

                // 获取按钮所在的表格（假设是 sap.ui.table.Table）
                var oTable = oButton.getParent();

                // 遍历父控件找到 SmartTable 控件
                while (oTable && !(oTable instanceof sap.ui.table.Table || oTable instanceof sap.m.Table)) {
                    oTable = oTable.getParent();
                }

                // 确保找到了表格控件
                if (!oTable) {
                    console.log("未找到表格控件");
                    return;
                }

                // 获取选中的行索引
                var aSelectedIndices = oTable.getSelectedIndices();

                // 获取表格绑定的模型
                var oModel = oTable.getModel();

                // 存储选中的行数据
                var aSelectedData = [];

                // 遍历选中的行索引，获取行数据
                aSelectedIndices.forEach(function (iIndex) {
                    var oContext = oTable.getContextByIndex(iIndex);
                    var oRowData = oModel.getProperty(oContext.getPath());
                    aSelectedData.push(oRowData);
                });

                return aSelectedData;
            }
        });
    });
