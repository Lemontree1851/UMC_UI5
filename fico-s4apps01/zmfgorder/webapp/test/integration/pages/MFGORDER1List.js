sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'fico.zmfgorder',
            componentId: 'MFGORDER1List',
            contextPath: '/MFGORDER1'
        },
        CustomPageDefinitions
    );
});