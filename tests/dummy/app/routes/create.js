import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var newName = 'user' + ( Math.random() * 1000 ).toFixed();
    return this.store.createRecord('user', {name: newName});
  },

  actions: {
    create: function() {
      this.get('controller.model').save();
    }
  }
});
