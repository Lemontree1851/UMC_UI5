sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zprinttemplate/test/integration/FirstJourney',
		'bc/zprinttemplate/test/integration/pages/TemplateList',
		'bc/zprinttemplate/test/integration/pages/TemplateObjectPage'
    ],
    function(JourneyRunner, opaJourney, TemplateList, TemplateObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zprinttemplate') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheTemplateList: TemplateList,
					onTheTemplateObjectPage: TemplateObjectPage
                }
            },
            opaJourney.run
        );
    }
);