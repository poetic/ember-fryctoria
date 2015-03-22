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

describe('Acceptance: Delete', function() {
  beforeEach(function() {
    App = startApp();
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var firstUser;

    visit('/fetch-all');

    andThen(function() {
      firstUser = find('#users li a:first').text();
    });

    click('button:contains("Offline")');

    visit('/');
    visit('/delete');
    click('button:contains("Delete")');
    click('button:contains("Online")');
    visit('/fetch-all');

    andThen(function() {
      expect(find('#users').text()).to.not.have.string(firstUser);
      done();
    });
  });
});
