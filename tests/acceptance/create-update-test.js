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

describe('Acceptance: Create and Update', function() {
  beforeEach(function() {
    App = startApp();
  });

  afterEach(function() {
    Ember.run(App, 'destroy');
  });

  it('works when offline', function(done) {
    this.timeout(10000);

    var name = 'User - ' + (Math.random() * 1000).toFixed(0);
    var age = (Math.random() * 1000).toFixed(0);
    var newAge = (Math.random() * 1000).toFixed(0);
    visit('/fetch-all');

    click('button:contains("Offline")');

    visit('/');

    // create
    visit('/create');
    fillIn('#name', name);
    fillIn('#age', age);
    click('button:contains("Create")');

    // update
    visit('/fetch-all');
    andThen(function() {
      find('#users li:contains("' + name + '") a.update').click();
    });

    andThen(function() {
      expect(currentPath()).to.be.equal('user-update-with-id');
      fillIn('#age', newAge);
      click('button:contains("Update")');
    });

    click('button:contains("Online")');

    visit('/fetch-all');

    andLater(function() {
      var userLi = find('li:contains("' + name + '")');
      expect(userLi.length).to.be.equal(1);
      expect(userLi.text()).to.include(newAge);
      done();
    });
  });
});
