sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'sd/invoiceprint/test/integration/FirstJourney',
		'sd/invoiceprint/test/integration/pages/InvoiceReportList',
		'sd/invoiceprint/test/integration/pages/InvoiceReportObjectPage'
    ],
    function(JourneyRunner, opaJourney, InvoiceReportList, InvoiceReportObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('sd/invoiceprint') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheInvoiceReportList: InvoiceReportList,
					onTheInvoiceReportObjectPage: InvoiceReportObjectPage
                }
            },
            opaJourney.run
        );
    }
);