import Ember from 'ember';

export function initialize(container, application) {
  // remove all jobs once there is an error
  // var syncer = container.lookup('syncer:main');
  // syncer.reopen({
  //   syncErrorHandler: function(error) {
  //     return Ember.RSVP.reject('clear');
  //   }
  // });
}

export default {
  name:       'reopen-syncer',
  after:      'syncer',
  initialize: initialize
};

