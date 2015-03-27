import DS           from 'ember-data';
import LFAdapter    from 'ember-localforage-adapter/adapters/localforage';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import Ember        from 'ember';
import isOffline    from './is-offline';
import createRecordInLocalAdapter from './create-record-in-local-adapter';

var Promise = Ember.RSVP.Promise;

/**
 * @class FryctoriaStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  fryctoria: {
    isOffline:       false,
    localAdapter:    null,
    localSerializer: null,
    trashStore:      null,
  },

  // fryctoriaObserver: function() {
  //   console.log('fryctoria.isOffline:', this.get('fryctoria.isOffline'));
  // }.observes('fryctoria.isOffline'),

  init: function() {
    var localAdapter    = LFAdapter.create({ container: this.get('container') });
    var localSerializer = LFSerializer.create({ container: this.get('container') });
    localAdapter.set('serializer', localSerializer);
    var trashStore      = DS.Store.extend({ container: this.get('container') }).create();

    this.set('fryctoria.localAdapter',    localAdapter);
    this.set('fryctoria.localSerializer', localSerializer);
    this.set('fryctoria.trashStore',      trashStore);

    this._super.apply(this, arguments);
  },

  /**
    This method returns a fresh collection from the server, regardless of if there is already records
    in the store or not.
    @method fetchAll
    @param {String or subclass of DS.Model} type
    @return {Promise} promise
  */
  fetchAll: function(type) {
    // this._super can not be called twice, we save the REAL super here
    var store          = this;
    var _superFetchAll = this.__nextSuper;

    return store.get('syncer').syncUp(store)
      .then(function() {
        return _superFetchAll.call(store, type);
      })
      .then(function(records) {
        reloadLocalRecords(store, type, records);
        return records;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchAll, [type]);
      });
  },

  // fetchById use the following methods:
  // find -> findById
  // model#reload -> store#reloadRecord
  fetchById: function(type, id, preload) {
    var store           = this;
    var _superFetchById = this.__nextSuper;

    return store.get('syncer').syncUp(store)
      .then(function() {
        return _superFetchById.apply(store, [type, id, preload]);
      })
      .then(function(record) {
        createRecordInLocalAdapter(store, type, record);
        return record;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchById, [type, id, preload]);
      });
  },

  /**
   * Used by:
   *   #find(<- #fetchById)
   *   #findByIds(private, orphan)
   */

  /**
    This method returns a record for a given type and id combination.
    @method findById
    @private
    @param {String or subclass of DS.Model} type
    @param {String|Integer} id
    @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
    @return {Promise} promise
  */
  findById: function(typeName, id, preload) {
    var store           = this;
    var _superFindById = this.__nextSuper;

    return store.get('syncer').syncUp(store)
      .then(function() {
        return _superFindById.apply(store, [typeName, id, preload]);
      })
      .then(function(record) {
        createRecordInLocalAdapter(store, typeName, record);
        return record;
      })
      .catch(function(error) {
        // NOTE: we need to change the state when to try to fetch a new record,
        // since the state is now loading after a failure attempt.
        function findByIdLocal() {
          // NOTE: can not do getById
          var record = store.all(typeName).findBy('id', id);
          if(record) {
            record.transitionTo('empty');
          }
          return _superFindById.apply(store, arguments);
        }
        return useLocalIfOffline(error, store, findByIdLocal, [typeName, id, preload]);
      });
  },

  /**
   * Used by:
   *   #find
   *   model#reload
   */

  /**
    This method is called by the record's `reload` method.
    This method calls the adapter's `find` method, which returns a promise. When
    **that** promise resolves, `reloadRecord` will resolve the promise returned
    by the record's `reload`.
    @method reloadRecord
    @private
    @param {DS.Model} record
    @return {Promise} promise
  */
  reloadRecord: function(record) {
    var store              = this;
    var _superReloadRecord = this.__nextSuper;
    var typeName           = record.constructor.typeKey;

    return store.get('syncer').syncUp(store)
      .then(function() {
        return _superReloadRecord.apply(store, [record]);
      })
      .then(function(record) {
        createRecordInLocalAdapter(store, typeName, record);
        return record;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superReloadRecord, [record]);
      });
  },

  adapterFor: function(type) {
    // console.log(
    //   'fryctoria.isOffline',
    //   this.get('fryctoria.isOffline')
    // );
    if(this.get('fryctoria.isOffline')) {
      return this.get('fryctoria.localAdapter');
    } else {
      return this._super.call(this, type);
    }
  },

  serializerFor: function(type) {
    if(this.get('fryctoria.isOffline')) {
      return this.get('fryctoria.localSerializer');
    } else {
      return this._super.call(this, type);
    }
  },

  createRecord: function() {
    this.set('fryctoria.isOffline', false);
    return this._super.apply(this, arguments);
  }
});

function useLocalIfOffline(error, store, localFn, _arguments) {
  if(isOffline(error && error.status)) {
    store.set('fryctoria.isOffline', true);
    return localFn.apply(store, _arguments);
  } else {
    return Promise.reject(error);
  }
}

/**
 * @param {boolean} sync used to determin wether we wait unitll the records are
 * reloaded locally.
 */
function reloadLocalRecords(store, type, records) {
  store.set('fryctoria.isOffline', true);
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);

  var localRecords = localAdapter.findAll(trashStore, modelType)
    .then(deleteAll)
    .then(createAll);

  return localRecords;

  function deleteAll(previousRecords) {
    return previousRecords.map(function(rawRecord) {
      // NOTE: we should pass snapshot instead of rawRecord to deleteRecord,
      // in deleteRecord, we only call snapshot.id, we can just pass the
      // rawRecord to it.
      return localAdapter.deleteRecord(trashStore, modelType, rawRecord);
    });
  }

  function createAll(previousRecords) {
    return Promise.all(previousRecords).then(function() {
      var createdRecords = records.map(function(record) {
        if(record.get('id')) {
          var snapshot = record._createSnapshot();
          return localAdapter.createRecord(trashStore, snapshot, snapshot);
        } else {
          var recordName = record.constructor && record.constructor.typeKey;
          var recordData = record.serialize && record.serialize();
          Ember.Logger.warn(
            'Record ' + recordName + ' does not have an id, therefor we can not create it in locally: ',
            recordData
          );
          return Promise.resolve();
        }
      });

      return Promise.all(createdRecords);
    });
  }
}
