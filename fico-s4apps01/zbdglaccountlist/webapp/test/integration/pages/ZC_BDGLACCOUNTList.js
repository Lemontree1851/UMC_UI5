sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'fico.zbdglaccountlist',
            componentId: 'ZC_BDGLACCOUNTList',
            contextPath: '/ZC_BDGLACCOUNT'
        },
        CustomPageDefinitions
    );
});