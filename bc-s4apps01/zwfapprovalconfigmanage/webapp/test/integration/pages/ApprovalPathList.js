sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'bc.zwfapprovalconfigmanage',
            componentId: 'ApprovalPathList',
            contextPath: '/ApprovalPath'
        },
        CustomPageDefinitions
    );
});