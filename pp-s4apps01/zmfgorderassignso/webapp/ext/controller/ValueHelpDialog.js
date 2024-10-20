sap.ui.define([
    "sap/m/Label",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Input"
], function (Label, FilterGroupItem, SearchField, UIColumn, Text, Filter, FilterOperator, Input) {
    "use strict";

    return {

        onValueHelpRequested: function (oEvent, that, sPath, aVHFields) {
            that._oInput = oEvent.getSource();
            that._aVHFields = aVHFields;
            that._oBasicSearchField = new SearchField();
            that.loadFragment({
                name: "pp.zmfgorderassignso.ext.fragments.ValueHelpDialog"
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar();
                that._oVHD = oDialog;
                that.getView().addDependent(oDialog);

                oDialog.setKey(that._aVHFields[0]);
                oDialog.setDescriptionKey(that._aVHFields[1]);

                // Set filter group items
                that._aVHFields.forEach(fieldName => {
                    var oFilterGroupItem = new FilterGroupItem({
                        groupName: "__$INTERNAL$",
                        visibleInFilterBar: true,
                        name: fieldName,
                        label: "{i18n>" + fieldName + "}"
                    });
                    var oControl = new Input({ name: fieldName });
                    oFilterGroupItem.setControl(oControl);
                    oFilterBar.addFilterGroupItem(oFilterGroupItem);
                });

                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                oFilterBar.setBasicSearch(that._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                that._oBasicSearchField.attachSearch(function () {
                    oFilterBar.search();
                });

                oDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(that.getView().getModel());
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        oTable.setSelectionMode("Single");
                        oTable.setSelectionBehavior("Row");
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: sPath,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        that._aVHFields.forEach(fieldName => {
                            var oColumn = new UIColumn({
                                width: "10rem",
                                label: new Label({ text: "{i18n>" + fieldName + "}" }),
                                template: new Text({ wrapping: false, text: "{" + fieldName + "}" })
                            });
                            oColumn.data({
                                fieldName: fieldName
                            });
                            oTable.addColumn(oColumn);
                        });
                    }
                    oDialog.update();
                    oDialog.open();
                }.bind(that));
            }.bind(that));
        },

        onFilterBarSearch: function (oEvent) {
            var aNewFilters = [];
            var sSearchQuery = this._oBasicSearchField.getValue(),
                aSelectionSet = oEvent.getParameter("selectionSet");
            var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
                if (oControl.getValue()) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: oControl.getValue()
                    }));
                }
                return aResult;
            }, []);
            if (sSearchQuery) {
                this._aVHFields.forEach(fieldName => {
                    aNewFilters.push(new Filter({ path: fieldName, operator: FilterOperator.Contains, value1: sSearchQuery }));
                });
                aFilters.push(new Filter({
                    filters: aNewFilters,
                    and: false
                }));
            }
            var oFilter = new Filter({
                filters: aFilters,
                and: true
            });
            this._oVHD.getTableAsync().then(function (oTable) {
                if (oTable.bindRows) {
                    oTable.getBinding("rows").filter(oFilter);
                }
                // This method must be called after binding update of the table.
                this._oVHD.update();
            }.bind(this));
        },

        onValueHelpOkPress: function (oEvent) {
            var aTokens = oEvent.getParameter("tokens");
            //--------------------------------------------------------------------------------
            var sInputPath = this._oInput.mBindingInfos.value.parts[0].path;
            if (sInputPath.includes("/")) {
                // head bind
                this.getView().getModel("local").setProperty(sInputPath, aTokens[0].getProperty("key"));
            }
            //--------------------------------------------------------------------------------
            this._oVHD.close();
        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },

        onValueHelpAfterClose: function () {
            this._oVHD.destroy();
        }
    };
});