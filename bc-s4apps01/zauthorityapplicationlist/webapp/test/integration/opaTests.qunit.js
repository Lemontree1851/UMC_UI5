sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zauthorityapplicationlist/test/integration/FirstJourney',
		'bc/zauthorityapplicationlist/test/integration/pages/FunctionsList',
		'bc/zauthorityapplicationlist/test/integration/pages/FunctionsObjectPage',
		'bc/zauthorityapplicationlist/test/integration/pages/AccessBtnObjectPage'
    ],
    function(JourneyRunner, opaJourney, FunctionsList, FunctionsObjectPage, AccessBtnObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zauthorityapplicationlist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheFunctionsList: FunctionsList,
					onTheFunctionsObjectPage: FunctionsObjectPage,
					onTheAccessBtnObjectPage: AccessBtnObjectPage
                }
            },
            opaJourney.run
        );
    }
);