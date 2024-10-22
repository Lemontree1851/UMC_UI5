sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zbdglaccountlist/test/integration/FirstJourney',
		'fico/zbdglaccountlist/test/integration/pages/ZC_BDGLACCOUNTList',
		'fico/zbdglaccountlist/test/integration/pages/ZC_BDGLACCOUNTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_BDGLACCOUNTList, ZC_BDGLACCOUNTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zbdglaccountlist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_BDGLACCOUNTList: ZC_BDGLACCOUNTList,
					onTheZC_BDGLACCOUNTObjectPage: ZC_BDGLACCOUNTObjectPage
                }
            },
            opaJourney.run
        );
    }
);