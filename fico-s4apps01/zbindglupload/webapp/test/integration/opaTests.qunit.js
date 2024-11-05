sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'fico/zbindglupload/test/integration/FirstJourney',
		'fico/zbindglupload/test/integration/pages/BDGLUploadList',
		'fico/zbindglupload/test/integration/pages/BDGLUploadObjectPage'
    ],
    function(JourneyRunner, opaJourney, BDGLUploadList, BDGLUploadObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('fico/zbindglupload') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheBDGLUploadList: BDGLUploadList,
					onTheBDGLUploadObjectPage: BDGLUploadObjectPage
                }
            },
            opaJourney.run
        );
    }
);