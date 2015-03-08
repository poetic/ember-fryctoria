import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';
import Ember from 'ember';

var Promise = Ember.RSVP.Promise;

export default DS.Store.extend({
  init: function() {
    var iceLocalAdapter = LFAdapter.create({ container: this.get('container') });
    var iceTrashStore   = DS.Store.extend({
        adapter:   this.get('localAdapter'),
        container: this.get('container')
      }).create();
    this.set('iceLocalAdapter', iceLocalAdapter);
    this.set('iceTrashStore',   iceTrashStore);

    this._super.apply(this, arguments);
  },

  fetchAll: function(type) {
    var store = this;
    // this._super can not be called twice, we save the REAL super here
    var _super = this.__nextSuper;

    return _super.call(store, type)
      .then(function(records) {
        return store.iceReloadLocalRecords(type, records);
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

  iceReloadLocalRecords: function(type, records) {
    var localAdapter = this.get('iceLocalAdapter');
    var trashStore   = this.get('iceTrashStore');
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
            localAdapter.createRecord(trashStore, modelType, record);
          });
        });
      });

    return records;
  },

  useLocalAdapter: false,
  changeToOffline: function() {
    this.set('useLocalAdapter', true);
  },
  changeToOnline: function() {
    this.set('useLocalAdapter', false);
  },
  /**
   * Overwrite adapterFor so that we can use localAdapter when necessary
   */
  adapterFor: function() {
    if(this.get('useLocalAdapter')) {
      return this.get('iceLocalAdapter');
    } else {
      return this._super.apply(this, arguments);
    }
  }
});

function isOffline(status) {
  return status === 0;
}
