sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zcommonconf/test/integration/FirstJourney',
		'bc/zcommonconf/test/integration/pages/CommonConfigList',
		'bc/zcommonconf/test/integration/pages/CommonConfigObjectPage'
    ],
    function(JourneyRunner, opaJourney, CommonConfigList, CommonConfigObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zcommonconf') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCommonConfigList: CommonConfigList,
					onTheCommonConfigObjectPage: CommonConfigObjectPage
                }
            },
            opaJourney.run
        );
    }
);