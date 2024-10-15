sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'pp.zledversioninfo',
            componentId: 'ZC_LEDPRODUCTIONVERSIONObjectPage',
            contextPath: '/ZC_LEDPRODUCTIONVERSION'
        },
        CustomPageDefinitions
    );
});