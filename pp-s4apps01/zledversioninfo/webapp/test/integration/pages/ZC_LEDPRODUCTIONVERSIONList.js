sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'pp.zledversioninfo',
            componentId: 'ZC_LEDPRODUCTIONVERSIONList',
            contextPath: '/ZC_LEDPRODUCTIONVERSION'
        },
        CustomPageDefinitions
    );
});