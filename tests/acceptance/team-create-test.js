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

describe('Acceptance: Create A Team(hasMany users)', function() {
  beforeEach(function() {
    App = startApp();
    store = App.__container__.lookup('store:main');
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    this.timeout(10000);

    var users, userRecords;

    Ember.run(function() {
      users = [
        store.createRecord('user', { name: 'create-team-user-1' }).save(),
        store.createRecord('user', { name: 'create-team-user-2' }).save()
      ];
    });

    var teamName = 'create-team-team-1';

    // #online
    RSVP.all(users).then(function(users) {
      userRecords = users;

      // #offline
      setOnlineStatus(false);
      // create a team with hasMany relationship while offline:
      var team = store.createRecord('team', { name: teamName });
      team.get('users').pushObjects(users);

      return team.save();
    }).then(function(team) {
      // #online
      setOnlineStatus(true);
      // after online, we do the syncing by geting all teams:
      return store.find('team');
    }).then(function(teams) {
      var team = teams.findBy('name', teamName);
      expect(team).to.exist('Team should be created and returned from server');
      expect(team.get('id')).not.to.include('fryctoria', 'Team should have a remoteId instead of a generated one');
      return team;
    }).then(function(team) {
      // clean up, remove teams and users created
      var deletedUsers = userRecords.map(function(user) {
        return user.destroyRecord();
      });
      return RSVP.all(deletedUsers).then(function() {
        return team.destroyRecord();
      });
    }).then(function() {
      // NOTE: wait until reloadLocalRecords is finished,
      // otherwise we would get strange error when destroying the app.
      andLater(function() {
        done();
      }, 1000);
    });
  });
});
