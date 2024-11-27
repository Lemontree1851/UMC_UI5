sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'bi.zfutureanalysis',
            componentId: 'ZC_BI005_REPORTObjectPage',
            contextPath: '/ZC_BI005_REPORT'
        },
        CustomPageDefinitions
    );
});