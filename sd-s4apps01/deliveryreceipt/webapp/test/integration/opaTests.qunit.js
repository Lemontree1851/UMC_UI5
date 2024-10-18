sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'sd/deliveryreceipt/test/integration/FirstJourney',
		'sd/deliveryreceipt/test/integration/pages/DeliveryReceiptList',
		'sd/deliveryreceipt/test/integration/pages/DeliveryReceiptObjectPage'
    ],
    function(JourneyRunner, opaJourney, DeliveryReceiptList, DeliveryReceiptObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('sd/deliveryreceipt') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheDeliveryReceiptList: DeliveryReceiptList,
					onTheDeliveryReceiptObjectPage: DeliveryReceiptObjectPage
                }
            },
            opaJourney.run
        );
    }
);