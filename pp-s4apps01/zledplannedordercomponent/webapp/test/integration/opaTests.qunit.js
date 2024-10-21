sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zledplannedordercomponent/test/integration/FirstJourney',
		'pp/zledplannedordercomponent/test/integration/pages/ZR_LEDPLANNEDORDERCOMPONENTList',
		'pp/zledplannedordercomponent/test/integration/pages/ZR_LEDPLANNEDORDERCOMPONENTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZR_LEDPLANNEDORDERCOMPONENTList, ZR_LEDPLANNEDORDERCOMPONENTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zledplannedordercomponent') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZR_LEDPLANNEDORDERCOMPONENTList: ZR_LEDPLANNEDORDERCOMPONENTList,
					onTheZR_LEDPLANNEDORDERCOMPONENTObjectPage: ZR_LEDPLANNEDORDERCOMPONENTObjectPage
                }
            },
            opaJourney.run
        );
    }
);