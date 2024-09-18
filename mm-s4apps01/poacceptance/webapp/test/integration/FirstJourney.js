sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZR_POACCEPTANCEList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZR_POACCEPTANCEList.onFilterBar().iExecuteSearch();
                
                Then.onTheZR_POACCEPTANCEList.onTable().iCheckRows();

                When.onTheZR_POACCEPTANCEList.onTable().iPressRow(0);
                Then.onTheZR_POACCEPTANCEObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});