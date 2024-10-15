sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zledversioninfo/test/integration/FirstJourney',
		'pp/zledversioninfo/test/integration/pages/ZC_LEDPRODUCTIONVERSIONList',
		'pp/zledversioninfo/test/integration/pages/ZC_LEDPRODUCTIONVERSIONObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_LEDPRODUCTIONVERSIONList, ZC_LEDPRODUCTIONVERSIONObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zledversioninfo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_LEDPRODUCTIONVERSIONList: ZC_LEDPRODUCTIONVERSIONList,
					onTheZC_LEDPRODUCTIONVERSIONObjectPage: ZC_LEDPRODUCTIONVERSIONObjectPage
                }
            },
            opaJourney.run
        );
    }
);