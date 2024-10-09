sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'mm.podataanalysis',
            componentId: 'PODataAnalysisObjectPage',
            contextPath: '/PODataAnalysis'
        },
        CustomPageDefinitions
    );
});