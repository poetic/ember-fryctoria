import Ember from 'ember';
import isOffline from './is-offline';

var Promise = Ember.RSVP.Promise;

/**
 * We save offline jobs to localforage and run them one at a time
 *
 * Job schema:
 * {
 *   operation: { 'create'|'update'|'delete' },
 *   typeName:  { String },
 *   record:    { Object },
 *   createdAt: { Date },
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
  createJob: function(operation, typeName, record) {
    var syncer = this;

    syncer.getJobs().then(function(jobs) {
      jobs.push({
        operation: operation,
        typeName:  typeName,
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
    var syncer = this;

    return syncer.getJobs().then(function(jobs) {
      if(jobs.length === 0) {
        Ember.Logger.info('Syncing jobs are empty.');
        return;
      }

      Ember.Logger.info('Syncing started.');
      jobs = jobs.sortBy('createdAt');

      // run jobs one at a time
      return jobs.reduce(function(acc, job) {
        return acc.then(function() {
          return syncer.runJob(job);
        });
      }, Promise.resolve())

      .then(function() {
        Ember.Logger.info('Syncing succeed.');
      })

      .catch(function(error) {
        if(isOffline(error && error.status)) {
          Ember.Logger.info('Can not connect to server, stop syncing');
          return;
        } else {
          return Promise.reject(error);
        }
      });
    });
  },

  runJob: function(job) {
    // TODO: use the store to get the normal adapter
    // remove the job from localforage when done
    var operation = job.operation;
    var typeName = job.typeName;
    var recordJSON = job.record;
    var store = this.getStore();
    var type, record;

    if(operation === 'delete') {
      type = store.modelFor(typeName);
      record = type._create({
        id:        recordJSON.id,
        store:     store.get('trashStore'),
        container: this.get('container'),
      });
      return this.adapterFor(type)
        .deleteRecord(store.get('trashStore'), type, record);
    }
  },

  adapterFor: function(typeName) {
    return this.getStore().adapterFor(typeName);
  },

  getStore: function() {
    return this.get('container').lookup('store:main');
  },

  namespace: 'EmberFryctoriaJobs',

  // low level functions that talk to localforage

  getJobs: function() {
    return this.get('db').getItem(this.get('namespace')).then(function(jobs) {
      return jobs || [];
    });
  },

  setJobs: function(jobs) {
    return this.get('db').setItem(this.get('namespace'), jobs);
  },
});
