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
var RSVP = Ember.RSVP;

describe('Acceptance: Syncer Reset', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'syncer-reset-user-id-1';
    var usersPromise;

    // #offline
    setOnlineStatus(false);
    Ember.run(function() {
      usersPromise = [
        store.createRecord('user', {name: name}).save(),
      ];
    });

    RSVP.all(usersPromise).then(function(users) {
      return store.fetchAll('user');

    }).then(function(users) {
      var user = users.findBy('name', name);
      expect(user).to.exist();

      store.unloadAll('user');
      return store.get('syncer').reset();

    }).then(function() {
      return store.fetchAll('user');

    }).then(function(users) {
      expect(users.get('length')).to.equal(0);
      expect(store.get('syncer.jobs.length')).to.equal(0);
      done();
    });
  });
});

