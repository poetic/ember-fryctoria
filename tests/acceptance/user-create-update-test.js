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

describe('Acceptance: User Create and Update', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'user-create-update-1';
    var nameUpdated = 'user-create-update-2';
    var age = 98;
    var ageUpdated = 102;
    var userPromise;

    Ember.run(function() {
      // #offline
      setOnlineStatus(false);
      userPromise = store.createRecord('user', {name: name, age: age});
    });

    userPromise.save().then(function(user) {
      return user.setProperties({name: nameUpdated, age: ageUpdated}).save();

    }).then(function() {
      // #online
      setOnlineStatus(true);
      return store.find('user');

    }).then(function(users) {
      // assertions
      var userUpdated = users.findBy('name', nameUpdated);
      expect(userUpdated).to.exist('Record should be created and returned from server');
      expect(userUpdated.get('id')).not.to.include('fryctoria', 'Record should have a remoteId instead of a generated one');
      expect(userUpdated.get('name')).to.equal(nameUpdated);
      expect(userUpdated.get('age')).to.equal(ageUpdated);
      return userUpdated;
    }).then(function(userUpdated) {
      // cleanup
      return userUpdated.destroyRecord();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
