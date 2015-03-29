import DS    from 'ember-data';
import Ember from 'ember';
import decorateAdapter    from './decorate-adapter';
import decorateSerializer from './decorate-serializer';
import isOffline                  from '../utils/is-offline';
import createRecordInLocalAdapter from '../utils/create-record-in-local-adapter';
import reloadLocalRecords         from '../utils/reload-local-records';

var Promise = Ember.RSVP.Promise;

/**
 * This will be used as store:main
 *
 * @class FryctoriaMainStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  fryctoria: {
    isOffline:       false,
    localAdapter:    null,
    localSerializer: null,
  },

  // fryctoriaObserver: function() {
  //   console.log('fryctoria.isOffline:', this.get('fryctoria.isOffline'));
  // }.observes('fryctoria.isOffline'),

  init: function() {
    var localStore      = this.container.lookup('store:local');
    var localAdapter    = localStore.get('adapter');
    var localSerializer = localAdapter.get('serializer');

    this.set('fryctoria.localAdapter',    localAdapter);
    this.set('fryctoria.localSerializer', localSerializer);

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
        reloadLocalRecords(store.get('container'), type);
        return records;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchAll, [type]);
      });
  },

  // fetchById use the following methods:
  // find -> findById
  // model#reload -> store#reloadRecord
  fetchById: function(typeName, id, preload) {
    var store           = this;
    var _superFetchById = this.__nextSuper;

    return store.get('syncer').syncUp(store)
      .then(function() {
        return _superFetchById.apply(store, [typeName, id, preload]);
      })
      .then(function(record) {
        createRecordInLocalAdapter(store, typeName, record);
        return record;
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchById, [typeName, id, preload]);
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
    if(this.get('fryctoria.isOffline')) {
      return this.get('fryctoria.localAdapter');
    } else {
      var adapter = this._super(type);
      return decorateAdapter(adapter);
    }
  },

  serializerFor: function(type) {
    if(this.get('fryctoria.isOffline')) {
      return this.get('fryctoria.localSerializer');
    } else {
      var serializer = this._super(type);
      return decorateSerializer(serializer);
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
