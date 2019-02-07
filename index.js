/**
 * Primary file for API
 * 
 */

 // Dependencies
const http = require('http');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const config = require('./config');

const server = http.createServer((req, res) => {
    
    // Get the URL and parse it
    let parsedUrl = url.parse(req.url, true);

    // Get the path from the request
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the Query Strings as an Object
    let queryStringObject = parsedUrl.query;

    // Get the HTTP method
    let method = req.method.toUpperCase();

    // Get the headers as an Object
    let headers = req.headers;

    // Get the payload, if there is one
    // Catch the data event from our request,
    // then decode it and write it to the buffer
    // string.
    let decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found, use not found handler
        let chosenHandler = (typeof(router[trimmedPath]) !== 'undefined')
                            ? router[trimmedPath]
                            : handlers.notFound;

        // Construct the data object to send to the handler
        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200
            statusCode = (typeof(statusCode) == 'number')
                            ? statusCode
                            : 200;
            // Use the payload called back by the handler, or default to an empty object
            payload = (typeof(payload) == 'object')
                        ? payload
                        : {};

            let payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log('Returning this response: ', statusCode, payloadString);

        });
    
    });

});

server.listen(config.port, () => console.log(`The server is listening on port ${config.port} in ${config.envName} mode.`));

// Define our handlers
const handlers = {}

// Sample handler
handlers.sample = (data, callback) => {
    // Callback an HTTP statuscode, and a payload
    callback(406, { 'name': 'sample handler' });
}

// Default handler
handlers.notFound = (data, callback) => {
    callback(404);
}

// Define a request router
const router = {
    'sample': handlers.sample
};