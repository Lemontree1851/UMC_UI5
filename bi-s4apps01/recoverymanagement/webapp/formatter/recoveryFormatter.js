sap.ui.define([
], function () {
    "use strict";
    return {

        formatRecoveryProgress: function(dRecoveryNeccessaryAmount, dRecoveryAlready) {
            if(!dRecoveryNeccessaryAmount && !dRecoveryAlready){
                return 0.00;
            }

            if (dRecoveryNeccessaryAmount === 0.00) {
                return 0.00;
            }

            return dRecoveryAlready / dRecoveryNeccessaryAmount;
        },

        formatCompanyCode: function(sCompanyCode, sCompanyName){
            return `${sCompanyName} (${sCompanyCode})`;
        },

        formatCustomer: function(sCustomer, sCustomerName){
            return `${sCustomerName} (${sCustomer})`;
        },

        formatRecoveryStatus: function(sRecoveryStatus, dRecoveryNeccessaryAmount, dRecoveryAlready){
            if(!sRecoveryStatus && !dRecoveryNeccessaryAmount && !dRecoveryAlready){
                return 1;
            }

            if(sRecoveryStatus === '2'){
                return sRecoveryStatus;
            }

            return dRecoveryAlready >= dRecoveryNeccessaryAmount ? '2' : "1";
        },

        formatPercentage: function(dPercentage){
            var dValue = (dPercentage * 100 ).toFixed(2);
            return `${dValue}%`;
        },

        formatPercentageOfAp: function(dPercentage){
            var dValue = (dPercentage * 100).toFixed(0);
            return `${dValue}%`;
        }
    }
});