import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var newName   = 'job' + ( Math.random() * 1000 ).toFixed();
    var newSalary = ( Math.random() * 1000 ).toFixed();
    var user = this.store.all('user').get('firstObject');
    return this.store.createRecord('job', {
      name:   newName,
      salary: newSalary,
      user:   user
    });
  },

  setupController: function(controller, model) {
    var users = this.store.all('user')
      .map(function(user) {
        return {
          user: user,
          name: user.get('name')
        };
      });
    controller.set('model', model);
    controller.set('users', users);
  },

  actions: {
    create: function() {
      this.get('controller.model').save();
    },
    willTransition: function() {
      var model = this.get('controller.model');
      if(model.get('isNew')) {
        model.deleteRecord();
      } else {
        model.rollback();
      }
    }
  }
});

