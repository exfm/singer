"use strict";

var Backbone = window.Backbone,
    nunjucks = window.nunjucks;

// Create a service.
// A service has a name and a repo URL.
// A service has a default cloudformation template.
var Service = Backbone.Model.extend({
    defaults: {
        'name': 'api',
        'repo': 'git://git@github.com:exfm/api.git',
        'minInstances': 1,
        'maxInstances': 1,
        'home': '/home/ubuntu/apps/api',
        'ami': '',
        'region': 'us-east'
    }
});

var ServiceCollection = Backbone.Collection.extend({
    model: Service,
    url: '/api/services'
});

// Create an environment.
// Environments specify overrides per service.
// Environments define an arbitrary key=value config object.
var Environment = Backbone.Model.extend({
    defaults: {
        name: 'production',
        'override-api': {
            'maxInstances': 5
        },
        'config': {
            'hello': 'world'
        }
    }
});

// Instance run a service in the context of an environment.
var Instance = Backbone.Model.extend({
    defaults: {
        'service': 'api',
        'environment': 'production',
        'instance_id': '123456'
    }
});

var ServiceInstances = Backbone.Collection.extend({
    model: Instance
});

var render = function(tpl, ctx){
    return nunjucks.env.render(tpl, ctx);
};


var MainView = Backbone.View.extend({
    initialize: function(){
        this.services = new ServiceCollection();
        this.services.on('sync', function(){
            this.$el.html(render('main.html', {
                'services': this.services.models,
                'environments': []
            }));
        }.bind(this));
        this.services.fetch();
    },
    render: function(){
        $('#app').append(this.$el);
        this.$el.html('loading...');
    }
});

new MainView().render();
