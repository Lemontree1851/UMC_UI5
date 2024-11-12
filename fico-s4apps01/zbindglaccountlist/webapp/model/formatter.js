sap.ui.define([], function() {
    "use strict";
    
    return {
        // Formatter function to change the background class based on the year
        getRowClass: function(calendaryear) {
            if (calendaryear < 2020) {
                return "bg-old-year"; // Custom CSS class for years before 2020
            } else if (calendaryear === 2020) {
                return "bg-current-year"; // Custom CSS class for the year 2020
            } else {
                return "bg-new-year"; // Custom CSS class for years after 2020
            }
        }
    };
});
