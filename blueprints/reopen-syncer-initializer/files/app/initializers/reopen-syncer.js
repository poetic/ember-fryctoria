import Ember from 'ember';

export function initialize(container, application) {
  var syncer = container.lookup('syncer:main');

  /*
   * Handle errors when tyring to syncUp.
   *
   * Default: undefined
   *
   * The following example remove all jobs and records in localforage
   * and restart your app.
   */
  // syncer.reopen({
  //   handleSyncUpError: function(error) {
  //     // delete all jobs and all records in localforage.
  //     this.reset().then(function() {
  //     // reload page.
  //       window.location.reload();
  //     });
  //   }
  // });

  /*
   * Decide what is offline.
   *
   * Default:
   * ```
   * isOffline: function(error) {
   *   return error && error.status === 0;
   * }
   * ```
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
