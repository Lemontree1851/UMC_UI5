sap.ui.define([
    "./Base",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Base, formatter, Filter, FilterOperator) {
    "use strict";

    return Base.extend("bi.recoveryupload.controller.Report", {

        formatter: formatter,

        onInit() {

        },

        onBeforeRebindTable: function (oEvent) {
            var aFilters = oEvent.getParameter("bindingParams").filters;
            var oNewFilter,
                aNewFilters = [];

            var sYearMonth = this.byId("idYearMonth").getValue().split("/").join("");
            var sUploadType = this.getModel("local").getProperty("/filterUploadType");

            aNewFilters.push(new Filter("UploadType", FilterOperator.EQ, sUploadType));

            if (sYearMonth) {
                aNewFilters.push(new Filter("YearMonth", FilterOperator.EQ, sYearMonth));
            }
            if (aNewFilters.length) {
                oNewFilter = new Filter({
                    filters: aNewFilters,
                    and: false
                });
                aFilters.push(oNewFilter);
            }
        },

        onSearch: function () {
            this.getModel().resetChanges();
        },

        onDelete: function () {
            var that = this;
            this._oTable = this.byId("idCustomListTable");
            var aSelectedItems = this._oTable.getSelectedIndices();
            var iLen = aSelectedItems.length;
            var aItems = [];
            if (!iLen) {
                MessageBox.error(this.getResourceBundle().getText("NoneSelected"));
                return;
            }
            while (iLen--) {
                var sPath = this._oTable.getContextByIndex(aSelectedItems[iLen]).getPath();
                var oRow = this.getModel().getObject(sPath);
                aItems.push(oRow);
            }
            var sTitleVariable = this.getModel("i18n").getResourceBundle().getText("Delete");
            var oRequestData = {
                UploadType: sUploadType,
                JsonData: aExcelSet
            };
            MessageBox.confirm(this.getModel("i18n").getResourceBundle().getText("ConfirmMessage", [sTitleVariable]), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._CallODataV2("ACTION", "/processLogic", [], {
                            "Event": "DELETE",
                            "Zzkey": JSON.stringify(oRequestData),
                            "RecordUUID": ""
                        }, {}).then(function (oResponse) {
                            var result = JSON.parse(oResponse.processLogic.Zzkey);

                            that._oTable.clearSelection();
                            that.getModel().resetChanges();
                            that.getModel().refresh();
                        }, function (oError) {
                            var sMsg;
                            if (oError.error.innererror.errordetails.length > 0) {
                                sMsg = oError.error.innererror.errordetails[0].message;
                            } else {
                                sMsg = oError.error.message.value;
                            }
                            MessageBox.error(sMsg);
                        });
                    }
                },
                dependentOn: this.getView()
            });
        }
    });
});