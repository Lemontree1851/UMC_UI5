sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zroutinglist/test/integration/FirstJourney',
		'pp/zroutinglist/test/integration/pages/ZC_ROUTINGLISTList',
		'pp/zroutinglist/test/integration/pages/ZC_ROUTINGLISTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_ROUTINGLISTList, ZC_ROUTINGLISTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zroutinglist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_ROUTINGLISTList: ZC_ROUTINGLISTList,
					onTheZC_ROUTINGLISTObjectPage: ZC_ROUTINGLISTObjectPage
                }
            },
            opaJourney.run
        );
    }
);