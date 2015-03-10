import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('fetch-all');
  this.route('fetch-by-id', {path: '/fetch-by-id/:id'});
  // This may not be supported by an adapter, implement later
  // this.route('findQuery');
  this.route('update');
  this.route('create');
  this.route('delete');
});

export default Router;
