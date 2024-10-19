sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/agencypurchasingn/test/integration/FirstJourney',
		'fico/agencypurchasingn/test/integration/pages/ItemdataList',
		'fico/agencypurchasingn/test/integration/pages/ItemdataObjectPage'
    ],
    function(JourneyRunner, opaJourney, ItemdataList, ItemdataObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/agencypurchasingn') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheItemdataList: ItemdataList,
					onTheItemdataObjectPage: ItemdataObjectPage
                }
            },
            opaJourney.run
        );
    }
);