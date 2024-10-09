sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'mm/podataanalysis/test/integration/FirstJourney',
		'mm/podataanalysis/test/integration/pages/PODataAnalysisList',
		'mm/podataanalysis/test/integration/pages/PODataAnalysisObjectPage'
    ],
    function(JourneyRunner, opaJourney, PODataAnalysisList, PODataAnalysisObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('mm/podataanalysis') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePODataAnalysisList: PODataAnalysisList,
					onThePODataAnalysisObjectPage: PODataAnalysisObjectPage
                }
            },
            opaJourney.run
        );
    }
);