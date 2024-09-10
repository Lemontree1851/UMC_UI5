sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'pp.zemailmasterupload',
            componentId: 'ZC_EMAILMASTERUPLOADObjectPage',
            contextPath: '/ZC_EMAILMASTERUPLOAD'
        },
        CustomPageDefinitions
    );
});