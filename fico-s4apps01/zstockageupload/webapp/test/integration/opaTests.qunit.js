sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zstockageupload/test/integration/FirstJourney',
		'fico/zstockageupload/test/integration/pages/STOCKAGEUPLOADList',
		'fico/zstockageupload/test/integration/pages/STOCKAGEUPLOADObjectPage'
    ],
    function(JourneyRunner, opaJourney, STOCKAGEUPLOADList, STOCKAGEUPLOADObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zstockageupload') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheSTOCKAGEUPLOADList: STOCKAGEUPLOADList,
					onTheSTOCKAGEUPLOADObjectPage: STOCKAGEUPLOADObjectPage
                }
            },
            opaJourney.run
        );
    }
);