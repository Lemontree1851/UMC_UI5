sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'pp.zroutinglist',
            componentId: 'ZC_ROUTINGLISTObjectPage',
            contextPath: '/ZC_ROUTINGLIST'
        },
        CustomPageDefinitions
    );
});