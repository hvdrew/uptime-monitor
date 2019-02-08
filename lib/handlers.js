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

// Users
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
                if (typeof(hashedPassword) != 'undefined') {
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
// TODO: We should only let an authenticated user access their object, don't let them access anyone else's
// TODO: Add logic to return a different error if the phone number provided was less than or greater than 10 digits.
handlers._users.GET = (data, callback) => {
    // Check that the phone number provided is valid
    let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10)
                    ? data.queryStringObject.phone.trim()
                    : false;
    if (phone) {
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
        callback(400, { 'Error': 'Missing required field.' });
    }
};

// Users PUT
// Required fields: phone
// Optional fields: firstName, lastName, password (at least one must be specified)
// TODO: Only let an authenticated user update their own object, don't let them update anyone else's
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
            callback(400, { 'Error': 'Missing field(s) to update.' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field.' });
    }
};

// Users DELETE
// Required fields: phone
// Optional fields: none
// TODO: Only let an authenticated user delete their object, don't let them delete anyone else's
// TODO: Cleanup (delete) any other data files associated with this user
handlers._users.DELETE = (data, callback) => {
    // Check that the phone number is valid
    let phone = (typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10)
                    ? data.queryStringObject.phone.trim()
                    : false;
    if (phone) {
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
        callback(400, { 'Error': 'Missing required field.' });
    }
};

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