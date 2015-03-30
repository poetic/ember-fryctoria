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

describe('Acceptance: User Create  ', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'user-create-1';
    var age = 98;
    var userPromise;

    // #offline
    setOnlineStatus(false);

    Ember.run(function() {
      userPromise = store.createRecord('user', {name: name, age: age});
    });

    userPromise.save().then(function() {
      // #online
      setOnlineStatus(true);
      return store.find('user');
    }).then(function(users) {
      var userCreated = users.findBy('name', name);
      expect(userCreated).to.exist('Record should be created and returned from server');
      expect(userCreated.get('id')).not.to.include('fryctoria', 'Record should have a remoteId instead of a generated one');
      return userCreated;
    }).then(function(userCreated) {
      // cleanup
      return userCreated.destroyRecord();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
