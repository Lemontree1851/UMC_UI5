sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zprintrecord/test/integration/FirstJourney',
		'bc/zprintrecord/test/integration/pages/PrintRecordList',
		'bc/zprintrecord/test/integration/pages/PrintRecordObjectPage'
    ],
    function(JourneyRunner, opaJourney, PrintRecordList, PrintRecordObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zprintrecord') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePrintRecordList: PrintRecordList,
					onThePrintRecordObjectPage: PrintRecordObjectPage
                }
            },
            opaJourney.run
        );
    }
);