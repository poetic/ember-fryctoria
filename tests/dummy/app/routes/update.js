import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.all('user').get('firstObject');
  },

  actions: {
    update: function() {
      this.get('controller.model').save();
    }
  }
});
