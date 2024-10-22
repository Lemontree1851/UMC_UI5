sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'fico.zbdglaccountlist',
            componentId: 'ZC_BDGLACCOUNTObjectPage',
            contextPath: '/ZC_BDGLACCOUNT'
        },
        CustomPageDefinitions
    );
});