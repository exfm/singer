"use strict";

var aws = require('plata'),
    http = require('http'),
    nconf = require('nconf'),
    mambo = require('mambo');

nconf.argv().env().use("memory").file("config.json");

aws.connect(nconf.get('aws'));
mambo.connect(nconf.get("aws:key"), nconf.get("aws:secret"));

module.exports = http.createServer(require('./'));
