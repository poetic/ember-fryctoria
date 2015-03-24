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

var App;

describe('Acceptance: Create Job', function() {
  beforeEach(function() {
    App = startApp();
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    this.timeout(10000);
    var name, userName;

    visit('/fetch-all-jobs');

    click('button:contains("Offline")');

    visit('/');
    visit('/create-job');

    andThen(function() {
      name = find('#name').val();
      userName = find("#user option:selected").text();
    });

    click('button:contains("Create")');

    click('button:contains("Online")');
    visit('/fetch-all-jobs');

    andLater(function() {
      var jobLi = find('li:contains("' + name + '")');
      expect(jobLi.length).to.be.equal(1);
      expect(jobLi.text()).to.include(userName);
      done();
    });
  });
});

