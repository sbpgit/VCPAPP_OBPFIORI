sap.ui.define([], function () {
    "use strict";

    return {

        /**
         * Formats a number to 2 decimal places
         * @param {number} sValue - The number to format
         * @returns {string} The formatted number
         */
        formatNumber: function (sValue) {
            if (!sValue || isNaN(sValue)) {
                return "-";
            }
            return parseFloat(sValue).toFixed(2);
        },

        /**
         * Formats a number as currency
         * @param {number} sValue - The number to format
         * @returns {string} The formatted currency
         */
        formatCurrency: function (sValue) {
            if (!sValue || isNaN(sValue)) {
                return "-";
            }
            
            var oNumberFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance({
                currencyCode: false,
                customCurrencies: {
                    "USD": {
                        "symbol": "$",
                        "decimals": 2
                    }
                }
            });
            
            return oNumberFormat.format(sValue, "USD");
        },

        /**
         * Formats a decimal as percentage
         * @param {number} sValue - The decimal to format
         * @returns {string} The formatted percentage
         */
        formatPercentage: function (sValue) {
            if (!sValue || isNaN(sValue)) {
                return "-";
            }
            
            var oPercentFormat = sap.ui.core.format.NumberFormat.getPercentInstance({
                decimals: 1
            });
            
            return oPercentFormat.format(sValue);
        },

        /**
         * Returns state based on value
         * @param {number} sValue - The value to check
         * @returns {string} The semantic state
         */
        formatState: function (sValue) {
            if (!sValue || isNaN(sValue)) {
                return "None";
            }
            
            if (sValue >= 90) {
                return "Success";
            } else if (sValue >= 70) {
                return "Warning";
            } else {
                return "Error";
            }
        }
    };
});