sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zdtimpconf/test/integration/FirstJourney',
		'bc/zdtimpconf/test/integration/pages/ConfigurationList',
		'bc/zdtimpconf/test/integration/pages/ConfigurationObjectPage'
    ],
    function(JourneyRunner, opaJourney, ConfigurationList, ConfigurationObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zdtimpconf') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheConfigurationList: ConfigurationList,
					onTheConfigurationObjectPage: ConfigurationObjectPage
                }
            },
            opaJourney.run
        );
    }
);