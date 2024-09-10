sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'sd.shipmentstorageloc',
            componentId: 'ZC_TSD_1001ObjectPage',
            contextPath: '/ZC_TSD_1001'
        },
        CustomPageDefinitions
    );
});