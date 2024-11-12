sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/m/MessageBox"
    ],
    function(BaseController,MessageBox) {
      "use strict";
  
      return BaseController.extend("mm.zprworkflow.controller.App", {
        onInit: function() {
        },
        onAppNavigate: function(oEvent) {
          // var sFromId = oEvent.getParameter("fromId");
          // const sRouteName = sFromId.split('---').pop();
          // if (sRouteName === "PurchaseReq") {
          //   // 检查是否允许导航
          //   if(this.getView().getModel().hasPendingChanges()) {
          //     oEvent.preventDefault();
          //     //例如：弹出提示框
          //     MessageBox.confirm("您有未保存的更改，是否继续离开？", {
          //       onClose: function (sAction) {
          //         if (sAction === MessageBox.Action.OK) {
          //           this.getOwnerComponent().getRouter().navTo(oEvent.getParameter("name"));
          //         }
          //       }.bind(this)
          //     });
          //   }
          // }
        }
      });
    }
  );
  