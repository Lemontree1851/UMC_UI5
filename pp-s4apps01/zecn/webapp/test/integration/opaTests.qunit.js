sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'zecn/zecn/test/integration/FirstJourney',
		'zecn/zecn/test/integration/pages/ECNList',
		'zecn/zecn/test/integration/pages/ECNObjectPage'
    ],
    function(JourneyRunner, opaJourney, ECNList, ECNObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('zecn/zecn') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheECNList: ECNList,
					onTheECNObjectPage: ECNObjectPage
                }
            },
            opaJourney.run
        );
    }
);