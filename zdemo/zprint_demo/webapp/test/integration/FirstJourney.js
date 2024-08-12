sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZZR_PRT_DEMOList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZZR_PRT_DEMOList.onFilterBar().iExecuteSearch();
                
                Then.onTheZZR_PRT_DEMOList.onTable().iCheckRows();

                When.onTheZZR_PRT_DEMOList.onTable().iPressRow(0);
                Then.onTheZZR_PRT_DEMOObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});