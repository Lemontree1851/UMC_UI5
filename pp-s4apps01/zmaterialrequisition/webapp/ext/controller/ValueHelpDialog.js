sap.ui.define([
    "sap/m/Label",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/SearchField",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Input",
    "sap/m/BusyDialog"
], function (Label, FilterGroupItem, SearchField, UIColumn, Text, Filter, FilterOperator, Input, BusyDialog) {
    "use strict";

    return {

        onValueHelpRequested: function (oEvent, that, sPath, aVHFields, aFilterFields) {
            that._oInput = oEvent.getSource();
            that._aVHFields = aVHFields;
            that._sValueHelpPath = sPath;
            if (aFilterFields) {
                that._aFilterFields = aFilterFields;
            } else {
                that._aFilterFields = aVHFields;
            }
            that._oBasicSearchField = new SearchField();
            that.loadFragment({
                name: "pp.zmaterialrequisition.ext.fragments.ValueHelpDialog"
            }).then(function (oDialog) {
                var oFilterBar = oDialog.getFilterBar();
                that._oVHD = oDialog;
                that.routing.getView().addDependent(oDialog);

                oDialog.setTitle(that.getModel("i18n").getResourceBundle().getText(that._aVHFields[0]));
                oDialog.setKey(that._aVHFields[0]);
                if (that._aVHFields[0] === "ManufacturingOrder") {
                    oDialog.setDescriptionKey("Item");
                } else {
                    oDialog.setDescriptionKey(that._aVHFields[1]);
                }

                var aFilters = [];
                var headSet = that.getModel("local").getProperty("/headSet");
                if (sPath === "/ZC_CostCenterVH" || sPath === "/ZC_CustomerCompanyVH") {
                    if (headSet.Plant) {
                        aFilters.push(new Filter({
                            path: "CompanyCode",
                            operator: FilterOperator.EQ,
                            value1: headSet.Plant
                        }));
                    }
                }
                if (sPath === "/ZC_ApplicationReceiverVH") {
                    if (headSet.Plant) {
                        aFilters.push(new Filter({
                            path: "Plant",
                            operator: FilterOperator.EQ,
                            value1: headSet.Plant
                        }));
                    }
                    if (headSet.Customer) {
                        aFilters.push(new Filter({
                            path: "Customer",
                            operator: FilterOperator.EQ,
                            value1: headSet.Customer
                        }));
                    }
                }
                if (sPath === "/ZC_ManufacturingOrderProductVH") {
                    if (headSet.Plant) {
                        aFilters.push(new Filter({
                            path: "ProductionPlant",
                            operator: FilterOperator.EQ,
                            value1: headSet.Plant
                        }));
                    }
                }

                // Set filter group items
                that._aFilterFields.forEach(fieldName => {
                    if (fieldName !== "UUID") {
                        var oControl;
                        var oFilterGroupItem = new FilterGroupItem({
                            groupName: "__$INTERNAL$",
                            visibleInFilterBar: true,
                            name: fieldName,
                            label: "{i18n>" + fieldName + "}"
                        });
                        if (fieldName === "Type") {
                            oControl = new sap.m.ComboBox({
                                name: fieldName,
                                items: {
                                    path: "/ZC_ApplicationTypeVH",
                                    template: {
                                        Type: "sap.ui.core.ListItem",
                                        key: "{Zvalue1}",
                                        text: "{Zvalue2}({Zvalue1})",
                                        additionalText: "{Zvalue1}"
                                    }
                                }
                            });
                        } else {
                            oControl = new Input({ name: fieldName });
                        }
                        oFilterGroupItem.setControl(oControl);
                        oFilterBar.addFilterGroupItem(oFilterGroupItem);
                    }
                });

                // Set Basic Search for FilterBar
                oFilterBar.setFilterBarExpanded(false);
                // oFilterBar.setBasicSearch(that._oBasicSearchField);

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
                            if (fieldName !== "UUID") {
                                var oColumn = new UIColumn({
                                    width: fieldName === "MailAddress" ? "15rem" : "10rem",
                                    label: new Label({ text: "{i18n>" + fieldName + "}" }),
                                    template: new Text({ wrapping: false, text: "{" + fieldName + "}" })
                                });
                                oColumn.data({
                                    fieldName: fieldName
                                });
                                oTable.addColumn(oColumn);
                            }
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
                var sValue;
                if (oControl.getName() === "Type") {
                    sValue = oControl.getSelectedKey();
                } else {
                    sValue = oControl.getValue();
                }
                if (sValue) {
                    aResult.push(new Filter({
                        path: oControl.getName(),
                        operator: FilterOperator.Contains,
                        value1: sValue
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
            var headSet = this.getModel("local").getProperty("/headSet");
            if (this._sValueHelpPath === "/ZC_CostCenterVH" || this._sValueHelpPath === "/ZC_CustomerCompanyVH") {
                if (headSet.Plant) {
                    aFilters.push(new Filter({
                        path: "CompanyCode",
                        operator: FilterOperator.EQ,
                        value1: headSet.Plant
                    }));
                }
            }
            if (this._sValueHelpPath === "/ZC_ApplicationReceiverVH" || this._sValueHelpPath === "/ZC_ProductVH") {
                if (headSet.Plant) {
                    aFilters.push(new Filter({
                        path: "Plant",
                        operator: FilterOperator.EQ,
                        value1: headSet.Plant
                    }));
                }
            }
            if (this._sValueHelpPath === "/ZC_ApplicationReceiverVH") {
                if (headSet.Customer) {
                    aFilters.push(new Filter({
                        path: "Customer",
                        operator: FilterOperator.EQ,
                        value1: headSet.Customer.padStart(10, '0')
                    }));
                }
            }
            if (this._sValueHelpPath === "/ZC_ManufacturingOrderProductVH") {
                if (headSet.Plant) {
                    aFilters.push(new Filter({
                        path: "ProductionPlant",
                        operator: FilterOperator.EQ,
                        value1: headSet.Plant
                    }));
                }
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
            var sKey = aTokens[0].getProperty("key").trim();
            var sText = "";
            if (aTokens[0].getProperty("text").includes("(")) {
                sText = aTokens[0].getProperty("text").split("(")[0].trim();
            }
            //--------------------------------------------------------------------------------
            var sInputPath = this._oInput.mBindingInfos.value.parts[0].path;
            var _myBusyDialog = new BusyDialog();
            _myBusyDialog.open();
            if (sInputPath.includes("/")) {
                // head bind
                if (sInputPath === "/headSet/Receiver") {
                    this.getModel("local").setProperty(sInputPath, sText);
                    this.getModel("local").setProperty("/headSet/ReceiverUUID", sKey);
                } else {
                    this.getModel("local").setProperty(sInputPath, sKey);
                    if (aTokens[0].getProperty("text").includes("(")) {
                        this.getModel("local").setProperty(sInputPath + "Name", sText);
                    } else {
                        this.getModel("local").setProperty(sInputPath + "Name", "");
                    }
                }
                _myBusyDialog.close();
                this._oInput.setValueState("None");
            } else {
                // table item bind
                var sBindFieldName = sInputPath;
                var sItemPath = this._oInput.getParent().oBindingContexts.local.sPath + "/";
                sInputPath = sItemPath + sBindFieldName;
                this.getModel("local").setProperty(sInputPath, sKey);
                var sPlant = this.getModel("local").getProperty("/headSet/Plant");
                if (sBindFieldName === "ManufacturingOrder") {
                    var oContextBinding = this.getModel().bindContext("/ZC_ManufacturingOrderProductVH" + "(ManufacturingOrder='" + sKey + "',Item='" + sText + "',ProductionPlant='" + sPlant + "')");
                    oContextBinding.requestObject().then(function (context) {
                        _myBusyDialog.close();
                        this._oInput.setValueState("None");
                        for (const key in context) {
                            if (!key.includes("@odata")) {
                                this.getModel("local").setProperty(sItemPath + key, context[key]);
                            }
                        }
                    }.bind(this), function (oError) {
                        _myBusyDialog.close();
                    }.bind(this));
                } else if (sBindFieldName === "Material") {
                    // var oContextBinding = this.getModel().bindContext("/ZC_ProductVH" + "('" + sKey + "')");
                    var aFilters = [];
                    aFilters.push(new Filter({
                        path: "Plant",
                        operator: FilterOperator.EQ,
                        value1: sPlant
                    }));
                    aFilters.push(new Filter({
                        path: "Material",
                        operator: FilterOperator.EQ,
                        value1: sKey
                    }));
                    var oContextBinding = this.getModel().bindList("/ZC_ProductVH", undefined, undefined, aFilters, {});
                    oContextBinding.requestContexts().then(function (aContext) {
                        _myBusyDialog.close();
                        this._oInput.setValueState("None");
                        if (aContext.length > 0) {
                            for (const boundContext of aContext) {
                                var object = boundContext.getObject();
                                for (const key in object) {
                                    if (!key.includes("@odata")) {
                                        this.getModel("local").setProperty(sItemPath + key, object[key]);
                                    }
                                }
                                // Calculate amount
                                var sValue = this.getModel("local").getProperty(sItemPath + "Quantity");
                                if (sValue && object["StandardPrice"]) {
                                    var iAmount = parseFloat(sValue) * parseFloat(object["StandardPrice"]);
                                    this.getModel("local").setProperty(sItemPath + "TotalAmount", iAmount);
                                    var sPlant = this.getModel("local").getProperty("/headSet/Plant");
                                    var aConfig = this.getModel("local").getProperty("/Config");
                                    var config = aConfig.find(element => element.Plant === sPlant);
                                    if (iAmount >= parseFloat(config.Amount)) {
                                        this.getModel("local").setProperty(sItemPath + "DeleteFlag", "W");
                                        // this.getModel("local").setProperty(sItemPath + "Status", "Error");
                                        $("#" + this._oControl.getParent().getId()).css("background-color", "#f2bfc0");
                                        $("#" + this._oControl.getParent().getId() + "-fixed").css("background-color", "#f2bfc0");
                                    } else {
                                        // this.getModel("local").setProperty(sItemPath + "Status", "None");
                                        $("#" + this._oControl.getParent().getId()).css("background-color", "#fff");
                                        $("#" + this._oControl.getParent().getId() + "-fixed").css("background-color", "#fff");
                                    }
                                }
                            }
                        }
                    }.bind(this), function (oError) {
                        _myBusyDialog.close();
                    }.bind(this));
                } else {
                    _myBusyDialog.close();
                    this.getModel("local").setProperty(sInputPath + "Name", sText);
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
        }
    };
});