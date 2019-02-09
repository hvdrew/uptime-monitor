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
    if (typeof(string) == 'string' && string.length > 0) {
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

// Create a string of random alpha-numeric characters of a given length
helpers.createRandomString = (stringLength) => {
    stringLength = (typeof(stringLength) == 'number' && stringLength > 0)
                    ? stringLength
                    : false;
    
    if (stringLength) {
        // Define all of the possible characters that could go into a string
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        let randomString = '';
        for (i = 0; i < stringLength; i++) {
            // Get a random character from the possibleCharacters string
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the final string
            randomString += randomCharacter;
        }

        // Return the final string
        return randomString;
    } else {
        return false;
    }
}

// Export the module
module.exports = helpers;