/*global QUnit*/

sap.ui.define([
	"sd/salesdocumentreport/controller/salesdocumentreport.controller"
], function (Controller) {
	"use strict";

	QUnit.module("salesdocumentreport Controller");

	QUnit.test("I should test the salesdocumentreport controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
