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

describe('Acceptance: Update', function() {
  beforeEach(function() {
    App = startApp();
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    var name = 'User - ' + (Math.random() * 1000).toFixed(0);
    var age = (Math.random() * 1000).toFixed(0);
    visit('/fetch-all');

    click('button:contains("Offline")');

    visit('/');
    visit('/update');
    fillIn('#name', name);
    fillIn('#age', age);
    click('button:contains("Update")');
    click('button:contains("Online")');
    visit('/fetch-all');

    andThen(function() {
      expect(find('li:contains("' + name + '")').length).to.be.equal(1);
      expect(find('li:contains("' + age + '")').length).to.be.equal(1);
      done();
    });
  });
});
