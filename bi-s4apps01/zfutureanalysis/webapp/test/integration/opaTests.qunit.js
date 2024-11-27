sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bi/zfutureanalysis/test/integration/FirstJourney',
		'bi/zfutureanalysis/test/integration/pages/ZC_BI005_REPORTList',
		'bi/zfutureanalysis/test/integration/pages/ZC_BI005_REPORTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_BI005_REPORTList, ZC_BI005_REPORTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bi/zfutureanalysis') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_BI005_REPORTList: ZC_BI005_REPORTList,
					onTheZC_BI005_REPORTObjectPage: ZC_BI005_REPORTObjectPage
                }
            },
            opaJourney.run
        );
    }
);