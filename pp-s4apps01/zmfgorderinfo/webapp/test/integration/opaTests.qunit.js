sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zmfgorderinfo/test/integration/FirstJourney',
		'pp/zmfgorderinfo/test/integration/pages/MfgOrderInfoList',
		'pp/zmfgorderinfo/test/integration/pages/MfgOrderInfoObjectPage'
    ],
    function(JourneyRunner, opaJourney, MfgOrderInfoList, MfgOrderInfoObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zmfgorderinfo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheMfgOrderInfoList: MfgOrderInfoList,
					onTheMfgOrderInfoObjectPage: MfgOrderInfoObjectPage
                }
            },
            opaJourney.run
        );
    }
);