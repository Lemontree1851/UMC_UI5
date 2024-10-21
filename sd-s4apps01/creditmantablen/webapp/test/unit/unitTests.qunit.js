/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"sd/creditmantablen/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
