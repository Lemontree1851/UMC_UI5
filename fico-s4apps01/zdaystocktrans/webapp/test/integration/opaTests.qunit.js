sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zdaystocktrans/test/integration/FirstJourney',
		'fico/zdaystocktrans/test/integration/pages/ZC_DAYSTOCKTRANSList',
		'fico/zdaystocktrans/test/integration/pages/ZC_DAYSTOCKTRANSObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_DAYSTOCKTRANSList, ZC_DAYSTOCKTRANSObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zdaystocktrans') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_DAYSTOCKTRANSList: ZC_DAYSTOCKTRANSList,
					onTheZC_DAYSTOCKTRANSObjectPage: ZC_DAYSTOCKTRANSObjectPage
                }
            },
            opaJourney.run
        );
    }
);