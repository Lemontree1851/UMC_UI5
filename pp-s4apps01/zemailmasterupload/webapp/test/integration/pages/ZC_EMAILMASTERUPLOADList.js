sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'pp.zemailmasterupload',
            componentId: 'ZC_EMAILMASTERUPLOADList',
            contextPath: '/ZC_EMAILMASTERUPLOAD'
        },
        CustomPageDefinitions
    );
});