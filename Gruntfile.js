"use strict";
var exec = require('child_process').exec;

module.exports = function(grunt){

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.registerTask('templates', 'Build frontend templates', function(){
        var done = this.async(),
            cmd = './node_modules/.bin/nunjucks-precompile ./lib/public/views/ > lib/public/templates.js';
        exec(cmd, function (error, stdout, stderr) {
            grunt.log.ok('templates written to `lib/public/templates.js`');
            done();
        });
    });

    // Default task(s).
    grunt.registerTask('default', ['templates']);
};