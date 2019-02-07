/**
 * Create and Export configuration variables
 * 
 */

// Container for all of the environments that we expect
const environments = {};

// Staging (Default) Object
environments.staging = {
    'port': 3000,
    'envName': 'staging'
};

// Production Object
environments.production = {
    'port': 8080,
    'envName': 'production'
};

// Determine which environment was passed as a command-line argument
let currentEnvironment = (typeof(process.env.NODE_ENV) == 'string')
                            ? process.env.NODE_ENV.toLowerCase()
                            : '';

// Check that the current environment is one of the environments found above, if not, default to staging
let environmentToExport = (typeof(environments[currentEnvironment]) == 'object')
                            ? environments[currentEnvironment]
                            : environments.staging;

// Export the Module
module.exports = environmentToExport;