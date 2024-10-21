sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'pp.zledplannedordercomponent',
            componentId: 'ZR_LEDPLANNEDORDERCOMPONENTObjectPage',
            contextPath: '/ZR_LEDPLANNEDORDERCOMPONENT'
        },
        CustomPageDefinitions
    );
});