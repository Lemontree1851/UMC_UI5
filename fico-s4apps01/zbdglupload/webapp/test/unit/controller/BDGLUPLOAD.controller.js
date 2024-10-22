/*global QUnit*/

sap.ui.define([
	"fico/zbdglupload/controller/BDGLUPLOAD.controller"
], function (Controller) {
	"use strict";

	QUnit.module("BDGLUPLOAD Controller");

	QUnit.test("I should test the BDGLUPLOAD controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
