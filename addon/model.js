import DS               from 'ember-data';
import isOffline        from './is-offline';
import generateUniqueId from './generate-unique-id';
import Ember            from 'ember';

var Promise = Ember.RSVP.Promise;

export default DS.Model.extend({
  /**
   * This method has no params
   */
  save: function() {
    var record     = this;
    var _superSave = this.__nextSuper;
    var store      = this.get('store');

    return store.get('syncer').syncUp()
      .then(function() {
        return _superSave.call(record);
      })
      .then(syncDown)
      .catch(function(error) {
        return useLocalIfOffline(error, record, _superSave);
      });
  }
});

function syncDown(record) {
  var localAdapter = record.get('container').lookup('store:local').get('adapter');
  var snapshot     = record._createSnapshot();

  if(record.get('isDeleted')) {
    localAdapter.deleteRecord(null, record.constructor, snapshot);
  } else {
    localAdapter.createRecord(null, record.constructor, snapshot);
  }

  return record;
}

function useLocalIfOffline(error, record, _superSave) {
  var isOnline = !isOffline(error && error.status);
  if(isOnline) {
    return Promise.reject(error);
  }

  var store = record.get('store');
  store.set('fryctoria.isOffline', true);

  // Make sure record has an id
  // https://github.com/emberjs/data/blob/1.0.0-beta.15/packages/ember-data/lib/system/store.js#L1289
  // NOTE: when we create a record, it does not have an id yet, we need to
  // generate one
  if(!record.get('id')) {
    store.updateId(record, {id: generateUniqueId()});
  }

  createJobInSyncer(store.get('syncer'), record);

  return _superSave.call(record);
}

function createJobInSyncer(syncer, record) {
  var typeName = record.constructor.typeKey;
  var operation;

  if(record.get('isNew')) {
    operation = 'create';
  } else if(record.get('isDeleted')) {
    operation = 'delete';
  } else {
    operation = 'update';
  }

  syncer.createJob(operation, typeName, record.serialize({includeId: true}));
}
