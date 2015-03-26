/* jshint expr:true */
import {
  describe,
  it,
  beforeEach,
  afterEach
} from 'mocha';
import { expect } from 'chai';
import Ember from 'ember';
import startApp from '../helpers/start-app';

var App, store;

describe('Acceptance: User Create and Delete', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'user-create-delete-1';
    var userPromise;

    // #offline
    setOnlineStatus(false);

    Ember.run(function() {
      userPromise = store.createRecord('user', {name: name});
    });

    userPromise.save().then(function(user) {
      return user.destroyRecord();

    }).then(function() {
      // #online
      setOnlineStatus(true);
      return store.find('user');

    }).then(function(users) {
      // assertions
      var userDeleted = users.findBy('name', name);
      expect(userDeleted).not.to.exist();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
