sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'pp.zecn',
            componentId: 'ECNObjectPage',
            contextPath: '/ECN'
        },
        CustomPageDefinitions
    );
});