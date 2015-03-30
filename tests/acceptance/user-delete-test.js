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

describe('Acceptance: User Delete', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    this.timeout(10000);

    var name = 'user-delete-1';
    var age = 98;
    var userPromise;

    // NOTE: delete all user with the same name, make tests more robust
    store.find('user').then(function(users) {
      return RSVP.all(users.map(function(user) {
        if(user.get('name') === name) {
          return user.destroyRecord();
        }
      }));

    }).then(function() {
      Ember.run(function() {
        userPromise = store.createRecord('user', {name: name, age: age});
      });
      return userPromise.save();

    }).then(function(user) {
      // #offline delete
      setOnlineStatus(false);
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
      // NOTE: wait until reloadLocalRecords is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      }, 1000);
    });
  });
});
