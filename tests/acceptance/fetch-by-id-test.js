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

describe('Acceptance: Fetch By Id', function() {
  beforeEach(function() {
    App = startApp();
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    visit('/fetch-all');

    // NOTE: wait until the data persist into localforage
    andLater(function() {
      click('button:contains("Offline")');
    });

    visit('/');
    visit('/fetch-by-id');

    click('button:contains("Online")');

    andLater(function() {
      expect(currentPath()).to.equal('fetch-by-id');
      expect(find('#name').text().length).to.be.above(0);
      done();
    });
  });
});
