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
 *
 * We save remoteIdRecords to localforage. They are used to lookup remoteIds
 * from localIds.
 *
 * RecordId schema:
 * {
 *   typeName: { String },
 *   localId:  { String },
 *   remoteId: { String }
 * }
 */
export default Ember.Object.extend({
  init: function() {
    var syncer = this;

    syncer.set('db', window.localforage);

    // initialize jobs cache in syncer
    // jobs may be used before we fetch jobs from localforage
    syncer.set('jobs', []);
    syncer.set('remoteIdRecords', []);

    // TODO: add a didInitialize flag?

    // NOTE: get remoteIdRecords first then get jobs,
    // since jobs depend on remoteIdRecords
    syncer.fetchRemoteIdRecords()
      .then(function(records)  { syncer.set('remoteIdRecords', records); })
      .then(function()     { return syncer.fetchJobs();      })
      .then(function(jobs) { syncer.set('jobs', jobs);       });
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

  syncUp: function() {
    return this.runAllJobs().catch(function(error) {
      Ember.Logger.warn('Syncing Error:');
      Ember.Logger.error(error && error.stack);
    });
  },

  /**
   * attampt to run all the jobs
   */
  runAllJobs: function() {
    var syncer = this;
    var jobs = this.get('jobs');

    // use online adapter
    syncer.getStore().set('fryctoria.isOffline', false);

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
      syncer.deleteAllRemoteIdRecords();
    })

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
    var remoteId   = syncer.getRemoteId(typeName, recordJSON.id);
    var record     = createRecordInTrashStore(type, remoteId);
    record.setupData(recordJSON);

    // load relationships
    record.eachRelationship(addRelationship);

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
      var recordIdBeforeCreate = record.get('id');
      record.set('id', null);

      syncedRecord = adapter.createRecord(trashStore, type, record)
        .then(updateIdInStore)
        .then(function(recordIdAfterCreate) {
          syncer.createRemoteIdRecord({
            typeName: typeName,
            localId:  recordIdBeforeCreate,
            remoteId: recordIdAfterCreate
          });
        });
    }

    // delete from db after syncing success
    return syncedRecord.then(
      syncer.deleteJobById.bind(this, job.id)
    );

    function createRecordInTrashStore(type, id) {
      return type._create({
        id:        id,
        store:     trashStore,
        container: syncer.get('container'),
      });
    }

    function addRelationship(name, descriptor) {
      var relationship = recordJSON[name];
      var relationshipId, relationshipIds;

      if(!relationship) { return; }

      if(descriptor.kind === 'belongsTo') {
        var belongsToRecord;
        // belongsTo
        relationshipId = relationship;
        relationshipId = syncer.getRemoteId(name, relationshipId);
        // NOTE: It is possible that the association is deleted in the store
        // and getById is null, so we create a fake record with the right id
        belongsToRecord = createRecordInTrashStore(descriptor.type, relationshipId);
        record.set(name, belongsToRecord);

      } else if(descriptor.kind === 'hasMany') {
        var hasManyRecords;
        // hasMany
        relationshipIds = relationship || [];
        hasManyRecords = relationshipIds.map(function(id) {
          var remoteId = syncer.getRemoteId(id);
          return createRecordInTrashStore(descriptor.type, remoteId);
        });
        record.pushObjects(hasManyRecords);
      }
    }

    function updateIdInStore(payload) {
      // NOTE: We should be in online mode now
      var recordExtracted = store.serializerFor(type).extract(
        trashStore, type, payload, record.get('id'), 'single'
      );

      var recordInStore = store.getById(typeName, recordIdBeforeCreate);

      // INFO: recordInStore may be null because it may be deleted
      // INFO: This works for relationships too
      if(recordInStore) {
        recordInStore.set('id', null);
        store.updateId(recordInStore, recordExtracted);
      }

      return recordExtracted.id;
    }
  },

  adapterFor: function(typeName) {
    return this.getStore().adapterFor(typeName);
  },

  getStore: function() {
    return this.get('container').lookup('store:main');
  },

  getRemoteId: function(typeName, id) {
    if(!id) {
      Ember.Logger.error('id can not be blank.');
    }

    if(isRemoteId(id)) {
      // id is remote already
      return id;

    } else {
      // try to find a remote id
      var remoteIdRecord = this.get('remoteIdRecords').find(function(record) {
        return record.typeName === typeName && record.localId === id;
      });

      // NOTE: it is possible we are trying to create one record
      // and does not have a remote id.
      return remoteIdRecord ? remoteIdRecord.remoteId : id;
    }
  },

  // database crud
  remoteIdRecordsNamespace: 'EmberFryctoriaRemoteIdRecords',

  fetchRemoteIdRecords: function() {
    return this.get('db')
               .getItem(this.get('remoteIdRecordsNamespace'))
               .then(function(records) { return records || []; });
  },

  createRemoteIdRecord: function(record) {
    var remoteIdRecords = this.get('remoteIdRecords');
    remoteIdRecords.push(record);
    return this.persistRemoteIdRecords(remoteIdRecords);
  },

  deleteAllRemoteIdRecords: function() {
    return this.persistRemoteIdRecords([]);
  },

  persistRemoteIdRecords: function(records) {
    return this.persistNamespace(this.get('remoteIdRecordsNamespace'), records);
  },

  jobsNamespace: 'EmberFryctoriaJobs',

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
               .getItem(this.get('jobsNamespace'))
               .then(function(jobs) { return jobs || []; });
  },

  persistJobs: function(jobs) {
    return this.persistNamespace(this.get('jobsNamespace'), jobs);
  },

  persistNamespace: function(namespace, data) {
    return this.get('db').setItem(namespace, data);
  },
});

function isRemoteId(id) {
  return id.indexOf('fryctoria') !== 0;
}
