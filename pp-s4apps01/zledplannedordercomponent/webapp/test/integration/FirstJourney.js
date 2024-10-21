sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZR_LEDPLANNEDORDERCOMPONENTList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZR_LEDPLANNEDORDERCOMPONENTList.onFilterBar().iExecuteSearch();
                
                Then.onTheZR_LEDPLANNEDORDERCOMPONENTList.onTable().iCheckRows();

                When.onTheZR_LEDPLANNEDORDERCOMPONENTList.onTable().iPressRow(0);
                Then.onTheZR_LEDPLANNEDORDERCOMPONENTObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});