/**
 * Library for storing and editing data
 * 
 * 
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for this module (to be exported later)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to the file
lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(`${lib.baseDir + dir}/${file}.json`, 'wx', (error, fileDescriptor) => {
        if (!error && fileDescriptor) {
            // Convert data to a string
            let stringData = JSON.stringify(data);

            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (error) => {
                if (!error) {
                    fs.close(fileDescriptor, (error) => {
                        if (!error) {
                            callback(false);
                        } else {
                            callback('Error closing new file.');
                        }
                    });
                } else {
                    callback('Error writing to new file.');
                }
            })
        } else {
            callback('Could not create new file, it may already exist.');
        }
    });
};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(`${lib.baseDir + dir}/${file}.json`, 'utf-8', (error, data) => {
        if (!error && data) {
            let parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        } else {
            callback(error, data);
        }
    });
};

// Update an existing file with new data
lib.update = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(`${lib.baseDir + dir}/${file}.json`, 'r+', (error, fileDescriptor) => {
        if (!error) {
            // Convert data to a string
            let stringData = JSON.stringify(data);

            // Trucate the file
            fs.ftruncate(fileDescriptor, (error) => {
                if (!error) {
                    // Write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, (error) => {
                        if (!error) {
                            fs.close(fileDescriptor, (error) => {
                                if (!error) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file.');
                                }
                            });
                        } else {
                            callback('Error writing to existing file.');
                        }
                    });
                } else {
                    callback('Error truncating file.');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exist yet.');
        }
    });
};

// Delete a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(`${lib.baseDir + dir}/${file}.json`, (error) => {
        if (!error) {
            callback(false);
        } else {
            callback('Error deleting file.');
        }
    });
};

// Export
module.exports = lib;