sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'mm.poacceptance',
            componentId: 'ZR_POACCEPTANCEObjectPage',
            contextPath: '/ZR_POACCEPTANCE'
        },
        CustomPageDefinitions
    );
});