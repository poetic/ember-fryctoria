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

describe('Acceptance: User Fetch By Id', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'user-fetch-by-id-1';
    var userPromise;

    Ember.run(function() {
      userPromise = store.createRecord('user', {name: name});
    });

    userPromise.save().then(function(userCreated) {
      // #offline
      setOnlineStatus(false);
      return store.fetchById('user', userCreated.get('id'));

    }).then(function(userFetched) {
      expect(userFetched.get('name')).to.equal(name);
      return userFetched.destroyRecord();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
