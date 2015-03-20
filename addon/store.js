import DS        from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';
import Ember     from 'ember';
import isOffline from './is-offline';

var Promise = Ember.RSVP.Promise;

export default DS.Store.extend({
  init: function() {
    var localAdapter = LFAdapter.create({ container: this.get('container') });
    var trashStore   = DS.Store.extend({
        adapter:   this.get('localAdapter'),
        container: this.get('container')
      }).create();
    this.set('localAdapter', localAdapter);
    this.set('trashStore',   trashStore);

    this._super.apply(this, arguments);
  },

  fetchAll: function(type) {
    // this._super can not be called twice, we save the REAL super here
    var store          = this;
    var _superFetchAll = this.__nextSuper;
    var _arguments     = arguments;

    return _superFetchAll.call(this, type)
      .then(function(records) {
        store.reloadLocalRecords(type, records);
        return records;
      })
      .then(function(records) {
        return syncToServer(store, records);
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchAll, _arguments);
      });
  },

  // custome function
  reloadLocalRecords: function(type, records) {
    var localAdapter = this.get('localAdapter');
    var trashStore   = this.get('trashStore');
    var modelType    = this.modelFor(type);

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
  },

  fetchById: function(type /* , id, preload */ ) {
    var store           = this;
    var _superFetchById = this.__nextSuper;
    var _arguments      = arguments;

    return _superFetchById.apply(this, _arguments)
      .then(function(record) {
        store.createLocalRecord(type, record);
        return record;
      })
      .then(function(record) {
        return syncToServer(store, record);
      })
      .catch(function(error) {
        return useLocalIfOffline(error, store, _superFetchById, _arguments);
      });
  },

  // custome function
  createLocalRecord: function(type, record) {
    var localAdapter = this.get('localAdapter');
    var trashStore   = this.get('trashStore');
    var modelType    = this.modelFor(type);
    localAdapter.createRecord(trashStore, modelType, record);
  },

  // custome property
  useLocalAdapter: false,

  // custome function
  changeToOffline: function() {
    this.set('useLocalAdapter', true);
  },

  // custome function
  changeToOnline: function() {
    this.set('useLocalAdapter', false);
  },

  /**
   * Overwrite adapterFor so that we can use localAdapter when necessary
   *
   * TODO:
   * rewrite adapterFor so that it detect which adapter we should use by checking
   * a property on type(which is an object). For now we are maintaining a state
   * machine and it is possible that other functions uses that function which is
   * not in that state.
   */
  adapterFor: function() {
    if(this.get('useLocalAdapter')) {
      return this.get('localAdapter');
    } else {
      return this._super.apply(this, arguments);
    }
  }
});

function useLocalIfOffline(error, store, _superFn, _arguments) {
  if(isOffline(error && error.status)) {
    store.changeToOffline();
    return _superFn.apply(store, _arguments).then(
      function(result) {
        store.changeToOnline();
        return result;
      },
      function(error) {
        store.changeToOnline();
        return Promise.reject(error);
      }
    );
  } else {
    return Promise.reject(error);
  }
}

// we return the records no matter the sync succeed or fail
function syncToServer(store, records) {
  return store.syncer.runAllJobs().then(
      function() {
        return records;
      },
      function(error) {
        Ember.Logger.error(error && error.stack);
        return records;
      }
    );
}
