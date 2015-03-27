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

describe('Acceptance: User Reload Record', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'user-reload-id-1';
    var userPromise;

    Ember.run(function() {
      userPromise = store.createRecord('user', {name: name});
    });

    userPromise.save().then(function(user) {
      // #offline
      setOnlineStatus(false);
      return user.reload();

    }).then(function(user) {
      expect(user.get('name')).to.equal(name);
      setOnlineStatus(true);
      return user.destroyRecord();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
