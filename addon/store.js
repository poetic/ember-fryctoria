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
    var store = this;
    // this._super can not be called twice, we save the REAL super here
    var _super = this.__nextSuper;

    return _super.call(this, type)
      .then(function(records) {
        store.reloadLocalRecords(type, records);
        return records;
      })
      .catch(function(error) {
        if(isOffline(error && error.status)) {
          store.changeToOffline();
          return _super.call(store, type).then(function(result) {
            store.changeToOnline();
            return result;
          });
        } else {
          return Promise.reject(error);
        }
      });
  },

  // custome function
  reloadLocalRecords: function(type, records) {
    var localAdapter = this.get('localAdapter');
    var trashStore   = this.get('trashStore');
    var modelType    = this.modelFor(type);

    localAdapter.findAll(trashStore, modelType)
      .then(function(previousRecords) {
        // delete all
        return previousRecords.map(function(rawRecord) {
          var record = Ember.Object.create(rawRecord);
          return localAdapter.deleteRecord(trashStore, modelType, record);
        });
      })
      .then(function(previousRecords) {
        // create all
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
      });

    return records;
  },

  fetchById: function(type /* , id, preload */ ) {
    var store      = this;
    var _super     = this.__nextSuper;
    var _arguments = arguments;

    return _super.apply(this, _arguments)
      .then(function(record) {
        store.createLocalRecord(type, record);
        return record;
      })
      .catch(function(error) {
        if(isOffline(error && error.status)) {
          store.changeToOffline();
          return _super.apply(store, _arguments).then(function(result) {
            store.changeToOnline();
            return result;
          });
        } else {
          return Promise.reject(error);
        }
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
   */
  adapterFor: function() {
    if(this.get('useLocalAdapter')) {
      return this.get('localAdapter');
    } else {
      return this._super.apply(this, arguments);
    }
  }
});
