sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'demo.zprintdemo',
            componentId: 'ZZR_PRT_DEMOObjectPage',
            contextPath: '/ZZR_PRT_DEMO'
        },
        CustomPageDefinitions
    );
});