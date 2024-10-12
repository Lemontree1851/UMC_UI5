sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zauthorityrolelist/test/integration/FirstJourney',
		'bc/zauthorityrolelist/test/integration/pages/RoleList',
		'bc/zauthorityrolelist/test/integration/pages/RoleObjectPage'
    ],
    function(JourneyRunner, opaJourney, RoleList, RoleObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zauthorityrolelist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRoleList: RoleList,
					onTheRoleObjectPage: RoleObjectPage
                }
            },
            opaJourney.run
        );
    }
);