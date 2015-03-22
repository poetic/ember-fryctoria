import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var firstUser = this.store.all('user').get('firstObject');
    return firstUser.reload(); // this makes a call to store#reloadRecord
  }
});


