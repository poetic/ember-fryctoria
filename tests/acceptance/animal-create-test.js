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

describe('Acceptance: Animal Create  ', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    setOnlineStatus(true);
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var nickName = 'animal-create-1';
    var animalPromise;

    // #offline
    setOnlineStatus(false);

    Ember.run(function() {
      animalPromise = store.createRecord('animal', {nickName: nickName});
    });

    animalPromise.save().then(function() {
      // #online
      setOnlineStatus(true);
      return store.find('animal');

    }).then(function(animals) {
      var animalCreated = animals.findBy('nickName', nickName);
      expect(animalCreated).to.exist('Record should be created and returned from server');
      expect(animalCreated.get('id')).not.to.include('fryctoria', 'Record should have a remoteId instead of a generated one');
      return animalCreated;

    }).then(function(animalCreated) {
      // cleanup
      return animalCreated.destroyRecord();

    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      });
    });
  });
});
