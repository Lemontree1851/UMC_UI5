sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'pp/zofsplitrule/test/integration/FirstJourney',
		'pp/zofsplitrule/test/integration/pages/SplitRuleList',
		'pp/zofsplitrule/test/integration/pages/SplitRuleObjectPage'
    ],
    function(JourneyRunner, opaJourney, SplitRuleList, SplitRuleObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('pp/zofsplitrule') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheSplitRuleList: SplitRuleList,
					onTheSplitRuleObjectPage: SplitRuleObjectPage
                }
            },
            opaJourney.run
        );
    }
);