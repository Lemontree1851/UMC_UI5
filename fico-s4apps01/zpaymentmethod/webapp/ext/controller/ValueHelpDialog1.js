sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/type/String',
	'sap/m/Token'
], function (compLibrary, Controller, TypeString, Token) {
	"use strict";

	return {
 

		// #region Multiple Conditions
		onMultipleConditionsVHRequested: function() {

			this.loadFragment({
				name: "fico.zpaymentmethod.ext.fragments.ValueHelpDialog1"
			}).then(function(oMultipleConditionsDialog) {

				this._oMultipleConditionsDialog = oMultipleConditionsDialog;
				this.getView().addDependent(oMultipleConditionsDialog);
				oMultipleConditionsDialog.setRangeKeyFields([{
					label: "Product",
					key: "ProductId",
					type: "string",
					typeInstance: new TypeString({}, {
						maxLength: 7
					})
				}]);

				oMultipleConditionsDialog.setTokens(this._oMultipleConditionsInput.getTokens());
				oMultipleConditionsDialog.open();
			}.bind(this));
		},
		onMultipleConditionsValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oMultipleConditionsInput.setTokens(aTokens);
			this._oMultipleConditionsDialog.close();
		},
		onMultipleConditionsCancelPress: function () {
			this._oMultipleConditionsDialog.close();
		},
		onMultipleConditionsAfterClose: function () {
			this._oMultipleConditionsDialog.destroy();
		},
		// #endregion

		// region Single Condition value help
		onSingleConditionVHRequested: function() {
			this.loadFragment({
				name: "sap.ui.comp.sample.valuehelpdialog.conditionsOnly.ValueHelpDialogSingleConditionTab"
			}).then(function(oSingleConditionDialog) {
				this._oSingleConditionDialog = oSingleConditionDialog;
				oSingleConditionDialog.setRangeKeyFields([{
					label: "Product",
					key: "ProductId",
					type: "string",
					typeInstance: new TypeString({}, {
						maxLength: 7
					})
				}]);

				oSingleConditionDialog.setTokens(this._oSingleConditionMultiInput.getTokens());
				oSingleConditionDialog.open();
			}.bind(this));
		},

		onSingleConditionValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
			this._oSingleConditionMultiInput.setTokens(aTokens);
			this._oSingleConditionDialog.close();
		},
		onSingleConditionCancelPress: function () {
			this._oSingleConditionDialog.close();
		},
		onSingleConditionAfterClose: function () {
			this._oSingleConditionDialog.destroy();
		},
		// #endregion


		_getDefaultTokens: function () {
			var ValueHelpRangeOperation = compLibrary.valuehelpdialog.ValueHelpRangeOperation;
			var oToken1 = new Token({
				key: "range_0",
				text: "=HT-1001"
			}).data("range", {
				"exclude": false,
				"operation": ValueHelpRangeOperation.EQ,
				"keyField": "ProductId",
				"value1": "HT-1001",
				"value2": ""
			});
			var oToken2 = new Token({
				key: "range_1",
				text: "!(=HT-1000)"
			}).data("range", {
				"exclude": true,
				"operation": ValueHelpRangeOperation.EQ,
				"keyField": "ProductId",
				"value1": "HT-1000",
				"value2": ""
			});

			return [oToken1, oToken2];
		}
    };
});