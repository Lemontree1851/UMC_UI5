sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/fixedassetprint/test/integration/FirstJourney',
		'fico/fixedassetprint/test/integration/pages/FIXEDASSETPRINTList',
		'fico/fixedassetprint/test/integration/pages/FIXEDASSETPRINTObjectPage'
    ],
    function(JourneyRunner, opaJourney, FIXEDASSETPRINTList, FIXEDASSETPRINTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/fixedassetprint') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheFIXEDASSETPRINTList: FIXEDASSETPRINTList,
					onTheFIXEDASSETPRINTObjectPage: FIXEDASSETPRINTObjectPage
                }
            },
            opaJourney.run
        );
    }
);