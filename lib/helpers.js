/**
 * Helpers for various tasks
 * 
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (string) => {
    if (typeof(str) == 'string' && string.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(string).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = (string) => {
    try {
        let obj = JSON.parse(string);
        return obj;
    } catch (error) {
        return {};
    }
}



// Export the module
module.exports = helpers;