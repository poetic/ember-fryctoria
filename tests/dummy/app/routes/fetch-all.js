import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.fetchAll('user');
  },

  actions: {
    delete: function(model) {
      model.destroyRecord();
    }
  }
});


