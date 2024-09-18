sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'mm.poacceptance',
            componentId: 'ZR_POACCEPTANCEList',
            contextPath: '/ZR_POACCEPTANCE'
        },
        CustomPageDefinitions
    );
});