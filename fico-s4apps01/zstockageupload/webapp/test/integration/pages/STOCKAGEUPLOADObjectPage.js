sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'fico.zstockageupload',
            componentId: 'STOCKAGEUPLOADObjectPage',
            contextPath: '/STOCKAGEUPLOAD'
        },
        CustomPageDefinitions
    );
});