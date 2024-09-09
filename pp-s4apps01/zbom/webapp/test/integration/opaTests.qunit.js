sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zbom/test/integration/FirstJourney',
		'pp/zbom/test/integration/pages/BOMList',
		'pp/zbom/test/integration/pages/BOMObjectPage'
    ],
    function(JourneyRunner, opaJourney, BOMList, BOMObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zbom') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheBOMList: BOMList,
					onTheBOMObjectPage: BOMObjectPage
                }
            },
            opaJourney.run
        );
    }
);