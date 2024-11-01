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
            return `${dPercentage * 100}%`;
        }
    }
});