sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'fico.zaccountingdoc',
            componentId: 'ZC_ACCOUNTINGDOCList',
            contextPath: '/ZC_ACCOUNTINGDOC'
        },
        CustomPageDefinitions
    );
});