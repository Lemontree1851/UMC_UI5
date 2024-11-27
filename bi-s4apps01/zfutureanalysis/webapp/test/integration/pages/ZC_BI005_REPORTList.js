sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'bi.zfutureanalysis',
            componentId: 'ZC_BI005_REPORTList',
            contextPath: '/ZC_BI005_REPORT'
        },
        CustomPageDefinitions
    );
});