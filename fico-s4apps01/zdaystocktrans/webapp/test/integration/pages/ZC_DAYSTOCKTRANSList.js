sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'fico.zdaystocktrans',
            componentId: 'ZC_DAYSTOCKTRANSList',
            contextPath: '/ZC_DAYSTOCKTRANS'
        },
        CustomPageDefinitions
    );
});