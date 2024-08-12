sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'demo.zprintdemo',
            componentId: 'ZZR_PRT_DEMOList',
            contextPath: '/ZZR_PRT_DEMO'
        },
        CustomPageDefinitions
    );
});