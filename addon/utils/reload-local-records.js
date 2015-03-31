import Ember from 'ember';

var RSVP = Ember.RSVP;

/*
 * This method does not change store, only change localforage
 *
 * @method reloadLocalRecords
 * @param {DS.Store} store store:main
 * @param {String|DS.Model} type
 */
export default function reloadLocalRecords(container, type) {
  var store        = container.lookup('store:main');
  var modelType    = store.modelFor(type);

  var localStore   = container.lookup('store:local');
  var localAdapter = localStore.get('adapter');

  var reloadedRecords = localAdapter.findAll(localStore, modelType)
    .then(deleteAll)
    .then(createAll);

  return reloadedRecords;

  function deleteAll(localRecords) {
    var deletedRecords = localRecords.map(function(record) {
      return localAdapter.deleteRecord(localStore, modelType, {id: record.id});
    });

    return RSVP.all(deletedRecords);
  }

  function createAll() {
    var records = store.all(type);
    var createdRecords = records.map(function(record) {
      return createLocalRecord(localAdapter, localStore, modelType, record);
    });

    return RSVP.all(createdRecords);
  }
}

function createLocalRecord(localAdapter, localStore, modelType, record) {
  if(record.get('id')) {
    var snapshot = record._createSnapshot();
    return localAdapter.createRecord(localStore, modelType, snapshot);

  } else {
    var recordName = record.constructor && record.constructor.typeKey;
    var warnMessage = 'Record ' + recordName + ' does not have an id, therefor we can not create it locally: ';

    var recordData = record.toJSON      && record.toJSON();

    Ember.Logger.warn(warnMessage, recordData);

    return RSVP.resolve();
  }
}
