import Ember from 'ember';

export function initialize(container, application) {
  // Remove all jobs once there is an error
  // var syncer = container.lookup('syncer:main');
  // syncer.reopen({
  //   handleSyncError: function(error) {
  //     return Ember.RSVP.reject('clear');
  //   }
  // });
}

export default {
  name:       'reopen-syncer',
  after:      'syncer',
  initialize: initialize
};

