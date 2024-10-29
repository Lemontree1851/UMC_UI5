sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'fico.zdaystocktrans',
            componentId: 'ZC_DAYSTOCKTRANSObjectPage',
            contextPath: '/ZC_DAYSTOCKTRANS'
        },
        CustomPageDefinitions
    );
});