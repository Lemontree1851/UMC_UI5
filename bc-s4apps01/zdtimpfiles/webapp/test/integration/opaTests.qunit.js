sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'bc/zdtimpfiles/test/integration/FirstJourney',
		'bc/zdtimpfiles/test/integration/pages/FilesList',
		'bc/zdtimpfiles/test/integration/pages/FilesObjectPage'
    ],
    function(JourneyRunner, opaJourney, FilesList, FilesObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('bc/zdtimpfiles') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheFilesList: FilesList,
					onTheFilesObjectPage: FilesObjectPage
                }
            },
            opaJourney.run
        );
    }
);