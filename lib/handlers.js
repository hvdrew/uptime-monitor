/**
 * Request Handlers
 * 
 * 
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define our handlers
const handlers = {};



/**
 * Users Route Handlers
 */
handlers.users = (data, callback) => {
    let acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users POST
// Required fields: firstName, lastname, phone, password, tosAgreement
// Optional fields: none.
// TODO: Add logic to return a different error if the phone number provided was less than or greater than 10 digits.
handlers._users.POST = (data, callback) => {
    // Check that all required fields are filled out
    let firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0)
                        ? data.payload.firstName.trim()
                        : false;
    let lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0)
                        ? data.payload.lastName.trim()
                        : false;
    let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10)
                        ? data.payload.phone.trim()
                        : false;
    let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0)
                        ? data.payload.password.trim()
                        : false;
    let tosAgreement = (typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true)
                        ? true
                        : false;
    
    if (firstName && lastName && phone && password && tosAgreement) {
        // Make sure that the user doesn't already exist
        _data.read('users', phone, (error, data) => {
            if (error) {
                // File didn't exist, we are good to go
                // Hash the password
                let hashedPassword = helpers.hash(password);

                // Create the user object
                if (typeof(hashedPassword) != 'undefined' && hashedPassword) {
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };
    
                    // Store the user
                    _data.create('users', phone, userObject, (error) => {
                        if (!error) {
                            callback(200);
                        } else {
                            console.log(error);
                            callback(500, { 'Error': 'Could not create the new user.' });
                        }
                    });
                } else {
                    callback(500, { 'Error': 'Could not hash the user\'s password.' });
                }

            } else {
                // User already exists
                callback(400, { 'Error': 'A user with that phone number already exists.' });
            }
        });
    } else {
        callback(400, { 'Error' : 'Missing required fields' });
    }


};

// Users GET
// Required fields: phone
// Optional fields: none
// TODO: Add logic to return a different error if the phone number provided was less than or greater than 10 digits.
handlers._users.GET = (data, callback) => {
    // Check that the phone number provided is valid
    let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10)
                    ? data.queryStringObject.phone.trim()
                    : false;
    if (phone) {
        // Get the token from the headers
        let token = (typeof(data.headers.token) == 'string')
                    ? data.headers.token
                    : false;
        
        // Verify that the given token from the headers is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, (error, data) => {
                    if (!error && data) {
                        // Remove the hashed password from the user object before returning it to the requester
                        delete data.hashedPassword;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};

// Users PUT
// Required fields: phone
// Optional fields: firstName, lastName, password (at least one must be specified)
handlers._users.PUT = (data, callback) => {
    // Check for the required field
    let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10)
                    ? data.payload.phone.trim()
                    : false;
    
    // Check for the optional fields
    let firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0)
                        ? data.payload.firstName.trim()
                        : false;
    let lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0)
                        ? data.payload.lastName.trim()
                        : false;
    let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0)
                        ? data.payload.password.trim()
                        : false;
    let tosAgreement = (typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true)
                        ? true
                        : false;

    // Error if the phone is invalid in any case
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {

            // Get the token from the headers
            let token = (typeof(data.headers.token) == 'string')
                        ? data.headers.token
                        : false;

            // Verify that the given token from the headers is valid for the phone number
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    // Lookup User
                    _data.read('users', phone, (error, userData) => {
                        if (!error && userData) {
                            // Update the fields necessary
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }

                            // Store the new updates
                            _data.update('users', phone, userData, (error) => {
                                if (!error) {
                                    callback(200);
                                } else {
                                    console.log(error);
                                    callback(500, { 'Error': 'Could not update the user.' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'The specified user does not exist.' });
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing required token in header, or token is invalid.' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing field(s) to update.' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};

// Users DELETE
// Required fields: phone
// Optional fields: none
// TODO: Cleanup (delete) any other data files associated with this user
handlers._users.DELETE = (data, callback) => {
    // Check that the phone number is valid
    let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10)
                    ? data.queryStringObject.phone.trim()
                    : false;
    if (phone) {
        // Get the token from the headers
        let token = (typeof(data.headers.token) == 'string')
                    ? data.headers.token
                    : false;

        // Verify that the given token from the headers is valid for the phone number
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup the user
                _data.read('users', phone, (error, data) => {
                    if (!error && data) {
                        _data.delete('users', phone, (error) => {
                            if (!error) {
                                callback(200);
                            } else {
                                callback(500, { 'Error': 'Could not delete the specified user.' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Could not find the specified user.' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header, or token is invalid.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};



/**
 * Tokens Route Handlers:
 */
handlers.tokens = (data, callback) => {
    let acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for all of the submethods
handlers._tokens = {};

// Tokens POST
// Required fields: phone, password
// Optional fields: none
handlers._tokens.POST = (data, callback) => {
    let phone = (typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10)
                ? data.payload.phone.trim()
                : false;
    let password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0)
                ? data.payload.password.trim()
                : false;

    if (phone && password) {
        // Lookup the User who matches the provided phone number
        _data.read('users', phone, (error, userData) => {
            if (!error && userData) {
                // Hash the sent password and compare it to the password stored in the user object
                let hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // If valid, create a new token with a random name, set expiration date 1 hour in the future
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + (1000 * 60 * 60);
                    let tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens', tokenId, tokenObject, (error) => {
                        if (!error) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create the new token.' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Password did not match the specified user\'s stored password.' });
                }
            } else {
                callback(400, { 'Error': 'Could not find the specified user.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field(s).' });
    }
};

// Tokens GET
// Required fields: id
// Optional data: none
handlers._tokens.GET = (data, callback) => {
    // Check that the id they sent was valid
    let id = (typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20)
                    ? data.queryStringObject.id.trim()
                    : false;
    if (id) {
        // Lookup the user
        _data.read('tokens', id, (error, tokenData) => {
            if (!error && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};

// Tokens PUT
// Required fields: id, extend
// Optional fields: none
handlers._tokens.PUT = (data, callback) => {
    let id = (typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20)
                ? data.payload.id.trim()
                : false;
    let extend = (typeof(data.payload.extend) == 'boolean' && data.payload.extend == true)
                ? true
                : false;
    
    if (id && extend) {
        // Lookup the token
        _data.read('tokens', id, (error, tokenData) => {
            if (!error && tokenData) {
                // Check to make sure the token isn't already expired
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + (1000 * 60 * 60);

                    // Store the new updates
                    _data.update('tokens', id, tokenData, (error) => {
                        if (!error) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not update the token\'s expiration.' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'The token has already expired and cannot be extended.' });
                }
            } else {
                callback(400, { 'Error': 'Specified token does not exist.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field(s), or field(s) are invalid.' });
    }
};

// Tokens DELETE
// Required fields: id
// Optional fields: none
handlers._tokens.DELETE = (data, callback) => {
    // Check that the id is valid
    let id = (typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20)
                    ? data.queryStringObject.id.trim()
                    : false;
    if (id) {
        // Lookup the token
        _data.read('tokens', id, (error, data) => {
            if (!error && data) {
                _data.delete('tokens', id, (error) => {
                    if (!error) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified token.' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find the specified token.' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};



// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
    // Lookup the token
    _data.read('tokens', id, (error, tokenData) => {
        if (!error && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

/**
 * Misc. Route Handlers:
 */
// Ping Handler
handlers.ping = (data, callback) => {
    callback(200);
};

// Default handler
handlers.notFound = (data, callback) => {
    callback(404);
};



// Export the module
module.exports = handlers;