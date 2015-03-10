import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.fetchAll('user').then(function(records) {
      return records.get('firstObject');
    });
  },

  actions: {
    delete: function() {
      this.get('controller.model').destroyRecord();
    }
  }
});




