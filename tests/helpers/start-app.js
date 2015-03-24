import Ember from 'ember';
import Application from '../../app';
import Router from '../../router';
import config from '../../config/environment';

// register helper;

Ember.Test.registerAsyncHelper('andLater',
  function(app, callback) {
    Ember.run(function() {
      Ember.run.later(function() {
        callback();
      }, 500);
    });
  }
);

export default function startApp(attrs) {
  var application;

  var attributes = Ember.merge({}, config.APP);
  attributes = Ember.merge(attributes, attrs); // use defaults, but you can override;

  Ember.run(function() {
    application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
  });

  return application;
}
