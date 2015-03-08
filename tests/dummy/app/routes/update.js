import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.fetchById('user', 1);
  },

  actions: {
    update: function() {
      this.get('controller.model').save();
    }
  }
});



