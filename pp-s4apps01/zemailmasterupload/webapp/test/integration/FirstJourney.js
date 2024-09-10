sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZC_EMAILMASTERUPLOADList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZC_EMAILMASTERUPLOADList.onFilterBar().iExecuteSearch();
                
                Then.onTheZC_EMAILMASTERUPLOADList.onTable().iCheckRows();

                When.onTheZC_EMAILMASTERUPLOADList.onTable().iPressRow(0);
                Then.onTheZC_EMAILMASTERUPLOADObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});