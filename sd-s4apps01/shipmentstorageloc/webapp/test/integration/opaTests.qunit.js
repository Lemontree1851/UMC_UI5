sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'sd/shipmentstorageloc/test/integration/FirstJourney',
		'sd/shipmentstorageloc/test/integration/pages/ZC_TSD_1001List',
		'sd/shipmentstorageloc/test/integration/pages/ZC_TSD_1001ObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_TSD_1001List, ZC_TSD_1001ObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('sd/shipmentstorageloc') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_TSD_1001List: ZC_TSD_1001List,
					onTheZC_TSD_1001ObjectPage: ZC_TSD_1001ObjectPage
                }
            },
            opaJourney.run
        );
    }
);