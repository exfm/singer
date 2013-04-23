"use strict";

var express = require("express"),
    log = require('plog')('singer'),
    nconf = require('nconf'),
    aws = require('plata'),
    nunjucks = require('nunjucks'),
    env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/views'));

var Model;

var app = module.exports = express(),
    topic = aws.sns.Topic('singer');

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');

env.express(app);

app.post('/api/sns-notification', topic.middleware(), function(req, res, next){
    var message = req.notification.message,
        event = message.Event,
        serviceName = message.AutoScalingGroupName.split('-')[0],
        instanceId = message.EC2InstanceId;

    if(event === 'autoscaling:EC2_INSTANCE_LAUNCH'){
        aws.ec2.waitForInstanceStart(instanceId).then(function(info){
            return Model.registerServiceInstance(serviceName, instanceId, info);
        }).then(function(info){
            return aws.route53.addCname(nconf.get('dns:externalZoneId'),
                info.public_dns, info.hostname).then(function(){
                    return info;
                });
        }).then(function(info){
            // @todo (lucas) Would be nice to able to associate some other
            // tag rules with an autoscaling group.
            aws.ec2.createTags(instanceId, {
                'Name': info.hostname,
                'Service Name': serviceName
            });
        });
    }
    else if(event === 'autoscaling:EC2_INSTANCE_TERMINATE'){
        Model.getServiceInstance(serviceName, instanceId).then(function(info){
            aws.route53.deleteCname(nconf.get('dns:externalZoneId'), info.public_dns, info.hostname).then(function(){
                Model.deregisterServiceInstance(serviceName, instanceId);
            });
        }, function(){
            log.warn('Instance `'+instanceId+'` not in service `'+serviceName+'`');
        });
    }
    res.send(200);
});

app.get('/api/service/:name/:environment', function(req, res){
    // get service details and instances
});

app.post('/api/service/:name/:environment/deploy', function(req, res){
    // exec cd home && git pull origin :branch && npm install && restart :name
});

app.post('/api/service/:name/:environment/start', function(req, res){
    // Create cloudformation stack or set min instances > 0
});

app.post('/api/service/:name/:environment/stop', function(req, res){
    // Stop all instances for this service environment
});

app.post('/api/service/:name/:environment/delete', function(req, res){
    // Stop this service environment and delete all resources
});

app.post('/api/service/:name/:environment/exec', function(req, res){
    // Run some bash across all instances.
});

app.get('/api/services', function(req, res){
    var services = [
        {
            'name': 'api',
            'repo': 'git://git@github.com:exfm/api.git',
            'branch': 'dev'
        }
    ];
    res.send(services);
});

app.post('/api/bootstrap', function(req, res){
    // Called by bootstrap.js on the instance
});

app.get('/api/environment/:environment', function(req, res){
    Model.getConfig(req.param('environment')).then(function(config){
        res.send(config);
    });
});

app.get('/', function(req, res){
    res.render('index.html');
});