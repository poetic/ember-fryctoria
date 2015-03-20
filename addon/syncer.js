import Ember from 'ember';
import isOffline from './is-offline';
import generateUniqueId from './generate-unique-id';

var RSVP = Ember.RSVP;

/**
 * We save offline jobs to localforage and run them one at a time
 *
 * Job schema:
 * {
 *   id:        { String },
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

    // initialize jobs cache in syncer
    // jobs may be used before we fetch jobs from localforage
    syncer.set('jobs', []);

    return syncer.fetchJobs().then(function(jobs) {
      syncer.set('jobs', jobs);
    });
  },

  /**
   * save an offline job locally, this is used in ember data models
   * @param {String} operation
   * @param {Object} record
   */
  createJob: function(operation, typeName, record) {
    var syncer = this;
    var jobs = this.get('jobs');

    jobs.pushObject({
      id:        generateUniqueId(),
      operation: operation,
      typeName:  typeName,
      record:    record,
      createdAt: (new Date()).getTime(),
    });

    return syncer.persistJobs(jobs);
  },

  /**
   * attampt to run all the jobs
   */
  runAllJobs: function() {
    var syncer = this;
    var jobs = this.get('jobs');

    if(jobs.length === 0) {
      Ember.Logger.info('Syncing jobs are empty.');
      return RSVP.resolve();
    }

    Ember.Logger.info('Syncing started.');
    jobs = jobs.sortBy('createdAt');

    // run jobs one at a time
    return jobs.reduce(function(acc, job) {
      return acc.then(function() {
        return syncer.runJob(job);
      });
    }, RSVP.resolve())

    .then(function() {
      Ember.Logger.info('Syncing succeed.');
    })

    .catch(function(error) {
      if(isOffline(error && error.status)) {
        Ember.Logger.info('Can not connect to server, stop syncing');
        return;
      } else {
        return RSVP.reject(error);
      }
    });
  },

  runJob: function(job) {
    var syncer     = this;

    var store      = syncer.getStore();
    var trashStore = store.get('fryctoria.trashStore');

    var typeName   = job.typeName;
    var type       = store.modelFor(typeName);

    var adapter    = syncer.adapterFor(type);

    var recordJSON = job.record;
    var record     = createRecordInTrashStore();
    record.setupData(recordJSON);

    var operation  = job.operation;
    var syncedRecord;

    if(operation === 'delete') {
      syncedRecord = adapter.deleteRecord(trashStore, type, record);

    } else if(operation === 'update') {
      // TODO: make reverse update possible
      // for now, we do not accept 'reverse update' i.e. update from the server
      // will not be reflected in the store
      syncedRecord = adapter.updateRecord(trashStore, type, record);

    } else if(operation === 'create') {
      // TODO: make reverse update possible
      // for now, we do not accept 'reverse update' i.e. update from the server
      // will not be reflected in the store
      syncedRecord = adapter.createRecord(trashStore, type, record)
        .then(updateIdInStore);
    }

    // delete from db after syncing success
    return syncedRecord.then(
      syncer.deleteJobById.bind(this, job.id)
    );

    function createRecordInTrashStore() {
      return type._create({
        id:        recordJSON.id,
        store:     trashStore,
        container: syncer.get('container'),
      });
    }

    function updateIdInStore(payload) {
      var recordExtracted = store.serializerFor(type).extract(
        trashStore, type, payload, record.get('id'), 'single'
      );

      var recordInStore = store.getById(typeName, record.get('id'));

      // INFO: recordInStore may be null because it may be deleted
      // INFO: This works for relationships too
      if(recordInStore) {
        recordInStore.set('id', null);
        store.updateId(recordInStore, recordExtracted);
      }
    }
  },

  adapterFor: function(typeName) {
    return this.getStore().adapterFor(typeName);
  },

  getStore: function() {
    return this.get('container').lookup('store:main');
  },

  namespace: 'EmberFryctoriaJobs',

  // database crud
  deleteJobById: function(id) {
    var syncer = this;
    var jobs = this.get('jobs');

    jobs = jobs.filter(function(job) {
      return id !== job.id;
    });

    // TODO: use popObject which is more performant
    syncer.set('jobs', jobs);
    return syncer.persistJobs(jobs);
  },

  fetchJobs: function() {
    return this.get('db')
               .getItem(this.get('namespace'))
               .then(function(jobs) { return jobs || []; });
  },

  persistJobs: function(jobs) {
    return this.get('db').setItem(this.get('namespace'), jobs);
  },
});
