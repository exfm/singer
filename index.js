var nconf = require('nconf'),
    plog = require('plog');

nconf.argv().env().use("memory").defaults({
    'port': 8080,
    'host': "0.0.0.0",
    'NODE_ENV': 'development'
});

module.exports = require("./lib/app");