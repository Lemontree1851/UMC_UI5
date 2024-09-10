sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zmaterialrequisition/test/integration/FirstJourney',
		'pp/zmaterialrequisition/test/integration/pages/MaterialRequisitionList',
		'pp/zmaterialrequisition/test/integration/pages/MaterialRequisitionObjectPage'
    ],
    function(JourneyRunner, opaJourney, MaterialRequisitionList, MaterialRequisitionObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zmaterialrequisition') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheMaterialRequisitionList: MaterialRequisitionList,
					onTheMaterialRequisitionObjectPage: MaterialRequisitionObjectPage
                }
            },
            opaJourney.run
        );
    }
);