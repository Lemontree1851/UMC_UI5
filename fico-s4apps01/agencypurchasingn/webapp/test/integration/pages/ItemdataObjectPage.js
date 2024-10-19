sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'fico.agencypurchasingn',
            componentId: 'ItemdataObjectPage',
            contextPath: '/Itemdata'
        },
        CustomPageDefinitions
    );
});