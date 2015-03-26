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

describe('Acceptance: Job(belongsTo) Create', function() {
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

    var userName = 'job-create-user-1';
    var jobName = 'job-create-1';
    var userPromise;
    var jobPromise;

    // #offline
    setOnlineStatus(false);

    Ember.run(function() {
      userPromise = store.createRecord('user', {name: userName});
    });

    userPromise.save().then(function(user) {
      var jobPromise = store.createRecord('job', {name: jobName, user: user}).save();
      return jobPromise;

    }).then(function(job) {
      setOnlineStatus(true);
      return store.find('job');

    }).then(function(jobs) {
      var jobCreated = jobs.findBy('name', jobName);
      expect(jobCreated).to.exist('Record should be created and returned from server');
      expect(jobCreated.get('id')).not.to.include('fryctoria', 'Record should have a remoteId instead of a generated one');
      expect(jobCreated.get('user.id')).to.exist();
      expect(jobCreated.get('user.id')).not.to.include('fryctoria', 'Record should have a remoteId instead of a generated one');
      return jobCreated;
    }).then(function(job) {
      // cleanup
      var user = job.get('user');
      return RSVP.all([job.destroyRecord(), user.destroyRecord()]);

    }).then(function() {
      setOnlineStatus(false);
      return RSVP.all([store.find('user'), store.find('job')]);

    }).then(function(data) {
      andLater(function() {
        var user = data[0].findBy('name', userName);
        var job  = data[1].findBy('name', jobName);
        expect(user).not.to.exist();
        expect(job).not.to.exist();
      }, 1000);
    }).then(function() {
      // NOTE: wait until saveLocal is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      }, 1000);
    });
  });
});
