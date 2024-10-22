sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zaccountingdoc/test/integration/FirstJourney',
		'fico/zaccountingdoc/test/integration/pages/ZC_ACCOUNTINGDOCList',
		'fico/zaccountingdoc/test/integration/pages/ZC_ACCOUNTINGDOCObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_ACCOUNTINGDOCList, ZC_ACCOUNTINGDOCObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zaccountingdoc') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_ACCOUNTINGDOCList: ZC_ACCOUNTINGDOCList,
					onTheZC_ACCOUNTINGDOCObjectPage: ZC_ACCOUNTINGDOCObjectPage
                }
            },
            opaJourney.run
        );
    }
);