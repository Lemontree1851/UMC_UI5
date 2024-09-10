sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zemailmasterupload/test/integration/FirstJourney',
		'pp/zemailmasterupload/test/integration/pages/ZC_EMAILMASTERUPLOADList',
		'pp/zemailmasterupload/test/integration/pages/ZC_EMAILMASTERUPLOADObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_EMAILMASTERUPLOADList, ZC_EMAILMASTERUPLOADObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zemailmasterupload') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_EMAILMASTERUPLOADList: ZC_EMAILMASTERUPLOADList,
					onTheZC_EMAILMASTERUPLOADObjectPage: ZC_EMAILMASTERUPLOADObjectPage
                }
            },
            opaJourney.run
        );
    }
);