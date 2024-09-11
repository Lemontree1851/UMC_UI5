sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'pp.zroutinglist',
            componentId: 'ZC_ROUTINGLISTList',
            contextPath: '/ZC_ROUTINGLIST'
        },
        CustomPageDefinitions
    );
});