import DS           from 'ember-data';
import LFAdapter    from 'ember-localforage-adapter/adapters/localforage';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import Ember        from 'ember';
import isOffline    from './is-offline';

var Promise = Ember.RSVP.Promise;

export default DS.Store.extend({
  fryctoria: {
    isOffline:       false,
    localAdapter:    null,
    localSerializer: null,
    trashStore:      null,
  },

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
        createLocalRecord(store, type, record);
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
        createLocalRecord(store, typeName, record);
        return record;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFindById, [typeName, id, preload]);
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
        createLocalRecord(store, typeName, record);
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

function reloadLocalRecords(store, type, records) {
  store.set('fryctoria.isOffline', true);
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);

  localAdapter.findAll(trashStore, modelType)
    .then(deleteAll)
    .then(createAll);

  return records;

  function deleteAll(previousRecords) {
    return previousRecords.map(function(rawRecord) {
      var record = Ember.Object.create(rawRecord);
      return localAdapter.deleteRecord(trashStore, modelType, record);
    });
  }

  function createAll(previousRecords) {
    Promise.all(previousRecords).then(function() {
      records.forEach(function(record) {
        if(record.get('id')) {
          localAdapter.createRecord(trashStore, modelType, record);
        } else {
          var recordName = record.constructor && record.constructor.typeKey;
          var recordData = record.serialize && record.serialize();
          Ember.Logger.warn(
            'Record ' + recordName + ' does not have an id: ',
            recordData
          );
        }
      });
    });
  }
}

function createLocalRecord(store, type, record) {
  store.set('fryctoria.isOffline', true);
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);
  localAdapter.createRecord(trashStore, modelType, record);
}
