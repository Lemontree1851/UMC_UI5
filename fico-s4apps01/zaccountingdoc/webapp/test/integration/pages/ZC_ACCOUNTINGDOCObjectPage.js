sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'fico.zaccountingdoc',
            componentId: 'ZC_ACCOUNTINGDOCObjectPage',
            contextPath: '/ZC_ACCOUNTINGDOC'
        },
        CustomPageDefinitions
    );
});