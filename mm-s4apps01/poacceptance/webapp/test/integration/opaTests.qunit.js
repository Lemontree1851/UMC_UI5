sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'mm/poacceptance/test/integration/FirstJourney',
		'mm/poacceptance/test/integration/pages/ZR_POACCEPTANCEList',
		'mm/poacceptance/test/integration/pages/ZR_POACCEPTANCEObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZR_POACCEPTANCEList, ZR_POACCEPTANCEObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('mm/poacceptance') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZR_POACCEPTANCEList: ZR_POACCEPTANCEList,
					onTheZR_POACCEPTANCEObjectPage: ZR_POACCEPTANCEObjectPage
                }
            },
            opaJourney.run
        );
    }
);