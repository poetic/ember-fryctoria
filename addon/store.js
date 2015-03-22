import DS           from 'ember-data';
import LFAdapter    from 'ember-localforage-adapter/adapters/localforage';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import Ember        from 'ember';
import isOffline    from './is-offline';

var Promise = Ember.RSVP.Promise;

export default DS.Store.extend({
  fryctoria: {
    useLocalAdapter: false,
    localAdapter:    null,
    localSerializer: null,
    trashStore:      null,
  },

  init: function() {
    var localAdapter    = LFAdapter.create({ container: this.get('container') });
    var localSerializer = LFSerializer.create({ container: this.get('container') });
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

  // TODO: remove fetchById, use the following:
  // find -> findById
  // record.reload
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
   *
   * TODO: test this
   * used by:
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
    Ember.Logger.info('findById');
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
   * Overwrite adapterFor so that we can use localAdapter when necessary
   *
   * TODO:
   * Do not relay on this, instead manully fetching and extracting records from
   * localforage!
   * May be not a good idea, since we need to rewrite ember-data
   * functions.
   */
  adapterFor: function(type) {
    // console.log(
    //   'fryctoria.useLocalAdapter',
    //   this.get('fryctoria.useLocalAdapter')
    // );
    if(this.get('fryctoria.useLocalAdapter')) {
      return this.get('fryctoria.localAdapter');
    } else {
      return this._super.call(this, type);
    }
  },

  serializerFor: function(type) {
    if(this.get('fryctoria.useLocalAdapter')) {
      return this.get('fryctoria.localSerializer');
    } else {
      return this._super.call(this, type);
    }
  }
});

function useLocalIfOffline(error, store, localFn, _arguments) {
  if(isOffline(error && error.status)) {
    store.set('fryctoria.useLocalAdapter', true);
    return localFn.apply(store, _arguments);
  } else {
    return Promise.reject(error);
  }
}

// TODO: create local equvalent for all the PUBLIC methos in ember data
// https://github.com/emberjs/data/blob/1.0.0-beta.15/packages/ember-data/lib/system/store.js#L940
// function fetchAllLocal(typeName) {
//   var store      = this;
//   var array      = store.all(typeName);
//   var type       = store.modelFor(typeName);
//   var adapter    = store.get('fryctoria.localAdapter');
//   var serializer = store.get('fryctoria.localSerializer');

//   array.set('isUpdating', true);

//   var records = adapter.findAll(store, type);
//   records = records.then(function(adapterPayload) {
//     _adapterRun(store, function() {
//      var payload = serializer.extract(store, type, adapterPayload, null, 'findAll');

//       Ember.assert("The response from a findAll must be an Array, not " + Ember.inspect(payload), Ember.typeOf(payload) === 'array');

//       store.pushMany(type, payload);
//     });

//     store.didUpdateAll(type);
//     return store.all(type);
//   });

//   return DS.PromiseArray(records);
// }

// function _adapterRun(store, fn) {
//   return store._backburner.run(fn);
// }

function reloadLocalRecords(store, type, records) {
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
          var recordData = record.toJSON && record.toJSON();
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
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);
  localAdapter.createRecord(trashStore, modelType, record);
}
