import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    var firstUser = this.store.all('user').get('firstObject');
    // force ember data to talk to remote server
    firstUser.unloadRecord();
    return this.store.findById('user', firstUser.get('id'));
  }
});


