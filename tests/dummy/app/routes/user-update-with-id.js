import Ember from 'ember';

export default Ember.Route.extend({
  model: function(params) {
    return this.store.getById('user', params.id);
  },

  actions: {
    update: function() {
      this.get('controller.model').save();
    }
  }
});
