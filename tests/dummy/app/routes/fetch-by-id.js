import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    var firstUserId = this.store.all('user').get('firstObject.id');
    return this.store.fetchById('user', firstUserId);
  }
});


