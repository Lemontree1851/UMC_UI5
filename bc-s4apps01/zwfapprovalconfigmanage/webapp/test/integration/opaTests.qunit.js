sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zwfapprovalconfigmanage/test/integration/FirstJourney',
		'bc/zwfapprovalconfigmanage/test/integration/pages/ApprovalPathList',
		'bc/zwfapprovalconfigmanage/test/integration/pages/ApprovalPathObjectPage',
		'bc/zwfapprovalconfigmanage/test/integration/pages/ApprovalNodeObjectPage'
    ],
    function(JourneyRunner, opaJourney, ApprovalPathList, ApprovalPathObjectPage, ApprovalNodeObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zwfapprovalconfigmanage') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheApprovalPathList: ApprovalPathList,
					onTheApprovalPathObjectPage: ApprovalPathObjectPage,
					onTheApprovalNodeObjectPage: ApprovalNodeObjectPage
                }
            },
            opaJourney.run
        );
    }
);