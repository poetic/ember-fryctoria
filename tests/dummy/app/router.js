import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('fetch-all');
  this.route('fetch-by-id');
  this.route('find-by-id-private');
  this.route('reload-record');
  // This may not be supported by an adapter, implement later
  // this.route('findQuery');
  this.route('update');
  this.route('user-update-with-id', { path: 'user-update-with-id/:id' });
  this.route('create');
  this.route('delete');

  // belongsTo relationship
  this.route('fetch-all-jobs');
  this.route('create-job');
});

export default Router;
