sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'bc.zwfapprovalconfigmanage',
            componentId: 'ApprovalNodeObjectPage',
            contextPath: '/ApprovalPath/_ApprovalNode'
        },
        CustomPageDefinitions
    );
});