sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'demo/zprintdemo/test/integration/FirstJourney',
		'demo/zprintdemo/test/integration/pages/ZZR_PRT_DEMOList',
		'demo/zprintdemo/test/integration/pages/ZZR_PRT_DEMOObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZZR_PRT_DEMOList, ZZR_PRT_DEMOObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('demo/zprintdemo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZZR_PRT_DEMOList: ZZR_PRT_DEMOList,
					onTheZZR_PRT_DEMOObjectPage: ZZR_PRT_DEMOObjectPage
                }
            },
            opaJourney.run
        );
    }
);