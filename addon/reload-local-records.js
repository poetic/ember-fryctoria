import Ember from 'ember';

var RSVP = Ember.RSVP;

/*
 * @method reloadLocalRecords
 * @param {DS.Store} store store:main
 * @param {String|DS.Model} type
 */
export default function reloadLocalRecords(container, type) {
  var store        = container.lookup('store:main');

  var modelType    = store.modelFor(type);

  var localAdapter = container.lookup('store:local').get('adapter');

  var reloadedRecords = localAdapter.findAll(null, modelType)
    .then(deleteAll)
    .then(createAll);

  return reloadedRecords;

  function deleteAll(localRecords) {
    var deletedRecords = localRecords.map(function(record) {
      return localAdapter.deleteRecord(null, modelType, {id: record.id});
    });

    return RSVP.all(deletedRecords);
  }

  function createAll() {
    var records = store.all(type);
    var createdRecords = records.map(function(record) {
      return createLocalRecord(localAdapter, modelType, record);
    });

    return RSVP.all(createdRecords);
  }
}

function createLocalRecord(localAdapter, modelType, record) {
  if(record.get('id')) {
    var snapshot = record._createSnapshot();
    return localAdapter.createRecord(null, modelType, snapshot);

  } else {
    var recordName = record.constructor && record.constructor.typeKey;
    var warnMessage = 'Record ' + recordName + ' does not have an id, therefor we can not create it in locally: ';

    var recordData = record.toJSON      && record.toJSON();

    Ember.Logger.warn(warnMessage, recordData);

    return RSVP.resolve();
  }
}
