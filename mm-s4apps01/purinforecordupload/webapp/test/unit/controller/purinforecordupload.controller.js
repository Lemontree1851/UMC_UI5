/*global QUnit*/

sap.ui.define([
	"mm/purinforecordupload/controller/purinforecordupload.controller"
], function (Controller) {
	"use strict";

	QUnit.module("purinforecordupload Controller");

	QUnit.test("I should test the purinforecordupload controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
