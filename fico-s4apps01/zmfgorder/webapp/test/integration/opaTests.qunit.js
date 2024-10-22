sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zmfgorder/test/integration/FirstJourney',
		'fico/zmfgorder/test/integration/pages/MFGORDER1List',
		'fico/zmfgorder/test/integration/pages/MFGORDER1ObjectPage'
    ],
    function(JourneyRunner, opaJourney, MFGORDER1List, MFGORDER1ObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zmfgorder') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheMFGORDER1List: MFGORDER1List,
					onTheMFGORDER1ObjectPage: MFGORDER1ObjectPage
                }
            },
            opaJourney.run
        );
    }
);