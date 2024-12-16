sap.ui.define([
    "sap/m/Label",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Input",
    "sap/m/Token",
    'sap/ui/model/type/String',
], function (Label, FilterGroupItem, SearchField, UIColumn, Text, Filter, FilterOperator, Input, Token, TypeString) {
    "use strict";

    return {

        onValueHelpRequested: function (oEvent, that, sPath, aVHFields) {

            that._oInput = oEvent.getSource();
            that._aVHFields = aVHFields;
            that._oBasicSearchField = new SearchField();
            that.loadFragment({
                name: "fico.zpaymentmethod.ext.fragments.ValueHelpDialog"
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar();
                that._oVHD = oDialog;
                //that.routing.getView().addDependent(oDialog);
                that.getView().addDependent(oDialog);
                oDialog.setKey(that._aVHFields[0]);
                if (that._aVHFields[0] === "ManufacturingOrder") {
                    oDialog.setDescriptionKey("Item");
                } else {
                    oDialog.setDescriptionKey(that._aVHFields[1]);
                }

                // Set filter group items
                that._aVHFields.forEach(fieldName => {

                    if (fieldName.includes("Name")) {
                    } else {
                        if(fieldName == "SupplierCompany") {
                        // Set key fields for filtering in the Define Conditions Tab
                        oDialog.setRangeKeyFields([{
                            label: "{i18n>" + fieldName + "}",
                            key: fieldName,
                            type: "string",
                            typeInstance: new TypeString({}, {
                                maxLength: 7
                            })
                        }]);
                    }
                    }

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
                    oTable.setModel(that.getModel());
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        //oTable.setSelectionMode("Single");
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

                }.bind(that));
                oDialog.open();


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

            //console.log(aTokens[1].getProperty("key"));
            if (sInputPath.includes("/")) {
                // head bind
                /*
                this.getModel("local").setProperty(sInputPath, aTokens[0].getProperty("key"));
                //this.getModel("local").setProperty(sInputPath, aTokens[1].getProperty("key"));
                var sFieldName = sInputPath.split("/")[2] + "Name";
                if (aTokens[0].getProperty("text").includes("(")) {
                    this.getModel("local").setProperty("/headSet/" + sFieldName, aTokens[0].getProperty("text").split("(")[0]);
                    console.log(aTokens[0].getProperty("text").split("(")[0]);
                } else {
                    this.getModel("local").setProperty("/headSet/" + sFieldName, "");
                    this.getModel("local").setProperty("/headSet/" + sFieldName, aTokens[0].getProperty("text"));
                }
                */
                var sFieldID = "id" + sInputPath.split("/")[2];
                var oView = this.getView();
                var oMultiInput1 = oView.byId(sFieldID);
                oMultiInput1.setTokens(aTokens);

                //var sItemPath1 = this._oInput.getParent().oBindingContexts.local.sPath + "/";
                // for (var i = 0; i < aTokens.length; i++) {
                //    oMultiInput1.setTokens([
                //         new Token({text: aTokens[i].getProperty("text"), key: aTokens[i].getProperty("key")})
                //    ]);
                //}

            } else {

                // table item bind
                var sBindFieldName = sInputPath;
                var sItemPath = this._oInput.getParent().oBindingContexts.local.sPath + "/";
                sInputPath = sItemPath + sBindFieldName;
                this.getModel("local").setProperty(sInputPath, aTokens[0].getProperty("key"));
                if (sBindFieldName === "ManufacturingOrder") {
                    var oContextBinding = this.getModel().bindContext("/ZC_ManufacturingOrderProductVH" + "(ManufacturingOrder='" + aTokens[0].getProperty("key").replace(/\s/g, "") + "',Item='" + aTokens[0].getProperty("text").split("(")[0].replace(/\s/g, "") + "')");
                    oContextBinding.requestObject().then(function (context) {
                        for (const key in context) {
                            if (!key.includes("@odata")) {
                                this.getModel("local").setProperty(sItemPath + key, context[key]);
                            }
                        }
                    }.bind(this));
                } else if (sBindFieldName === "Material") {
                    var oContextBinding = this.getModel().bindContext("/ZC_ProductVH" + "('" + aTokens[0].getProperty("key").replace(/\s/g, "") + "')");
                    oContextBinding.requestObject().then(function (context) {
                        for (const key in context) {
                            if (!key.includes("@odata")) {
                                this.getModel("local").setProperty(sItemPath + key, context[key]);

                            }
                        }
                        // Calculate amount
                        var sValue = this.getModel("local").getProperty(sItemPath + "Quantity");
                        if (sValue && context["StandardPrice"]) {
                            var iAmount = parseFloat(sValue) * parseFloat(context["StandardPrice"]);
                            this.getModel("local").setProperty(sItemPath + "TotalAmount", iAmount);
                            if (iAmount >= 100000) {
                                this.getModel("local").setProperty(sItemPath + "DeleteFlag", "W");
                            }
                        }
                    }.bind(this));
                } else {
                    this.getModel("local").setProperty(sInputPath + "Name", aTokens[0].getProperty("text").split("(")[0]);

                }
            }
            //--------------------------------------------------------------------------------
            this._oVHD.close();
        },

        onValueHelpCancelPress: function () {
            this._oVHD.close();
        },

        onValueHelpAfterClose: function () {
            this._oVHD.destroy();
        },
        // @endregion
        // Internal helper methods
        _getDefaultTokens: function () {
            var ValueHelpRangeOperation = compLibrary.valuehelpdialog.ValueHelpRangeOperation;
            var oToken1 = new Token({
                key: "PD-103",
                text: "Mouse (PD-103)"
            });

            var oToken2 = new Token({
                key: "range_0",
                text: "!(=PD-102)"
            }).data("range", {
                "exclude": true,
                "operation": ValueHelpRangeOperation.EQ,
                "keyField": "ProductCode",
                "value1": "PD-102",
                "value2": ""
            });

            return [oToken1, oToken2];
        },
    };
});