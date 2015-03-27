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

describe('Acceptance: User Fetch All', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name1 = 'user-fetch-all-id-1';
    var name2 = 'user-fetch-all-id-2';
    var usersPromise;

    Ember.run(function() {
      usersPromise = [
        store.createRecord('user', {name: name1}).save(),
        store.createRecord('user', {name: name2}).save()
      ];
    });

    RSVP.all(usersPromise).then(function(users) {
      // #offline
      setOnlineStatus(false);
      return store.fetchAll('user');

    }).then(function(users) {
      var user1 = users.findBy('name', name1);
      var user2 = users.findBy('name', name2);
      expect(user1.get('name')).to.equal(name1);
      expect(user2.get('name')).to.equal(name2);

      setOnlineStatus(true);
      return RSVP.all([
        user1.destroyRecord(),
        user2.destroyRecord(),
      ]);

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
