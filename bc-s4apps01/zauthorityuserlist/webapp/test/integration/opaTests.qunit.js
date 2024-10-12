sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zauthorityuserlist/test/integration/FirstJourney',
		'bc/zauthorityuserlist/test/integration/pages/UserList',
		'bc/zauthorityuserlist/test/integration/pages/UserObjectPage'
    ],
    function(JourneyRunner, opaJourney, UserList, UserObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zauthorityuserlist') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheUserList: UserList,
					onTheUserObjectPage: UserObjectPage
                }
            },
            opaJourney.run
        );
    }
);