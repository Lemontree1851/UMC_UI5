/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"mm/zpurchasepricevariance/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
