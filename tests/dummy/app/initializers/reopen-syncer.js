import Ember from 'ember';

export function initialize(container, application) {
  var syncer = container.lookup('syncer:main');

  /*
   * Handle errors when tyring to syncUp
   * Remove all jobs once there is an error and restart your app
   */
  // syncer.reopen({
  //   handleSyncError: function(error) {
  //     this.reset(); // delete all jobs.
  //     application.reset(); // reset application. A reload is recommended.
  //   }
  // });

  /*
   * Decide what is offline
   * The following is the default behavior
   */
  // syncer.reopen({
  //   isOffline: function(error) {
  //     return error && error.status === 0;
  //   }
  // });
}

export default {
  name:       'reopen-syncer',
  after:      'syncer',
  initialize: initialize
};

