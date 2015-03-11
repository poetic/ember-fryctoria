import Ember from 'ember';

/**
 * We save offline jobs to localforage and run them one at a time
 *
 * Job schema:
 * {
 *   operation: { 'create'|'update'|'delete' }
 *   record:    { Object }
 *   createdAt: { Date }
 * }
 */
export default Ember.Object.extend({
  init: function() {
    var syncer = this;

    syncer.set('db', window.localforage);

    // TODO
    // attampt to runAllJobs periodically
    // check if it is back online and then runAllJobs

    // initialize localforage, make sure 'FryctoriaSyncer' is an array
    return syncer.getJobs().then(function(jobs) {
      if(!(jobs instanceof Array)) {
        return syncer.setJobs([]);
      }
    });
  },

  /**
   * save an offline job locally, this is used in ember data models
   * @param {String} operation
   * @param {Object} record
   */
  createJob: function(operation, record) {
    var syncer = this;

    syncer.getJobs().then(function(jobs) {
      jobs.push({
        operation: operation,
        record:    record,
        createdAt: (new Date()).getTime(),
      });
      syncer.setJobs(jobs);
    });
  },

  /**
   * attampt to run all the jobs
   */
  runAllJobs: function() {

  },

  runJob: function(/* job */) {
    // TODO: use the store to get the normal adapter
  },

  namespace: 'EmberFryctoriaJobs',

  // low level functions that talk to localforage

  getJobs: function() {
    return this.get('db').getItem(this.get('namespace'));
  },

  setJobs: function(jobs) {
    return this.get('db').setItem(this.get('namespace'), jobs);
  },
});
