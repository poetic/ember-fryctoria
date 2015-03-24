import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var store = this.store;
    return store.fetchAll('user').then(function() {
      return store.fetchAll('job');
    });
  },

  actions: {
    delete: function(model) {
      model.destroyRecord();
    }
  }
});



