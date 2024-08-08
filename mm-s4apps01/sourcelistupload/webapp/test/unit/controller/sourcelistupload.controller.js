/*global QUnit*/

sap.ui.define([
	"mm/sourcelistupload/controller/sourcelistupload.controller"
], function (Controller) {
	"use strict";

	QUnit.module("sourcelistupload Controller");

	QUnit.test("I should test the sourcelistupload controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
