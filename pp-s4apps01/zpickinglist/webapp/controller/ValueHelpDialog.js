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

        onValueHelpRequested: function (oEvent, that, sPath, aVHFields, aFilterFields) {
            that._oInput = oEvent.getSource();
            that._aVHFields = aVHFields;
            if (aFilterFields) {
                that._aFilterFields = aFilterFields;
            } else {
                that._aFilterFields = aVHFields;
            }
            that._oBasicSearchField = new SearchField();
            that.loadFragment({
                name: "pp.zpickinglist.fragments.ValueHelpDialog"
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar();
                that._oVHD = oDialog;
                that.getView().addDependent(oDialog);

                // Custom Logic Begin
                var oBindRow = that.getModel().getProperty(oEvent.getSource().getParent().getBindingContext().getPath());
                var aFilters = [];
                if (sPath === "/ZC_MaterialStockVH") {
                    oDialog.setTitle(that.getModel("i18n").getResourceBundle().getText("StorageLocationFrom"));
                    oDialog.setKey(that._aVHFields[1]);
                    oDialog.setDescriptionKey(that._aVHFields[2]);
                    aFilters.push(new Filter({
                        path: "Plant",
                        operator: FilterOperator.EQ,
                        value1: oBindRow.Plant
                    }));
                    aFilters.push(new Filter({
                        path: "Material",
                        operator: FilterOperator.EQ,
                        value1: oBindRow.Material
                    }));
                } else {
                    oDialog.setKey(that._aVHFields[0]);
                    oDialog.setDescriptionKey(that._aVHFields[1]);
                }
                // Custom Logic End

                // Set filter group items
                that._aFilterFields.forEach(fieldName => {
                    var oFilterGroupItem = new FilterGroupItem({
                        groupName: "__$INTERNAL$",
                        visibleInFilterBar: true,
                        name: fieldName,
                        label: "{i18n>" + fieldName + "}"
                    });
                    var oControl = new Input({ name: fieldName });
                    // Custom Logic Begin
                    // if (sPath === "/ZC_MaterialStockVH") {
                    //     oControl = new Input({ name: fieldName, value: oBindRow[fieldName] });
                    // }
                    // Custom Logic End
                    oFilterGroupItem.setControl(oControl);
                    oFilterBar.addFilterGroupItem(oFilterGroupItem);
                });

                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(true);
                oFilterBar.setBasicSearch(that._oBasicSearchField);

                // Trigger filter bar search when the basic search is fired
                that._oBasicSearchField.attachSearch(function () {
                    oFilterBar.search();
                });

                oDialog.getTableAsync().then(function (oTable) {
                    oTable.setModel(that.getModel());
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        oTable.setSelectionMode("Single");
                        oTable.setSelectionBehavior("Row");
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: sPath,
                            filters: aFilters,
                            events: {
                                dataReceived: function () {
                                    oDialog.update();
                                }
                            }
                        });
                        that._aVHFields.forEach(fieldName => {
                            var oColumn = new UIColumn({
                                width: "auto",
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
            //----------------------------Custom Logic----------------------------------------
            var sInputPath = this._oInput.mBindingInfos.value.parts[0].path;
            if (sInputPath.includes("/")) {
                // head bind
            } else {
                // table item bind
                var sBindFieldName = "/" + sInputPath;
                var sItemPath = this._oInput.getParent().getBindingContext().getPath();
                sInputPath = sItemPath + sBindFieldName;
                this.getModel().setProperty(sInputPath, aTokens[0].getProperty("key"));
                this.getModel().setProperty(sInputPath + "Name", aTokens[0].getProperty("text").split("(")[0]);

                if (sBindFieldName === "/StorageLocationFrom") {
                    var oRow = this.getModel().getProperty(sItemPath);
                    var sPlant = oRow.Plant;
                    var sMaterial = oRow.Material;
                    var sPath = "/ZC_MaterialStockVH(Material='" + sMaterial + "',Plant='" + sPlant + "',StorageLocation='" + aTokens[0].getProperty("key") + "')";
                    var oVHRow = this.getModel().getProperty(sPath);
                    this.getModel().setProperty(sInputPath + "Stock", oVHRow["StockQuantity"]);
                    this.getModel().setProperty(sItemPath + "/M_CARD_Quantity", oVHRow["M_CARD_Quantity"]);
                    this.getModel().setProperty(sItemPath + "/M_CARD", oVHRow["M_CARD"]);
                }
            }
            //----------------------------Custom Logic----------------------------------------
            this._oInput.setValueState("None");
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