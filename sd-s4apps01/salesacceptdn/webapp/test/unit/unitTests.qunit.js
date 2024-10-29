/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"sd/salesacceptdn/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
