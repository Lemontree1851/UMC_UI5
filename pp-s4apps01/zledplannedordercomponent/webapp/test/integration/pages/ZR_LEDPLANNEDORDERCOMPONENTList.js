sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'pp.zledplannedordercomponent',
            componentId: 'ZR_LEDPLANNEDORDERCOMPONENTList',
            contextPath: '/ZR_LEDPLANNEDORDERCOMPONENT'
        },
        CustomPageDefinitions
    );
});