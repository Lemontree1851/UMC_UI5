sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheSTOCKAGEUPLOADList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheSTOCKAGEUPLOADList.onFilterBar().iExecuteSearch();
                
                Then.onTheSTOCKAGEUPLOADList.onTable().iCheckRows();

                When.onTheSTOCKAGEUPLOADList.onTable().iPressRow(0);
                Then.onTheSTOCKAGEUPLOADObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});