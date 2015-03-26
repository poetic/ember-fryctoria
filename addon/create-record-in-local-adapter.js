export default function createRecordInLocalAdapter(store, type, record) {
  store.set('fryctoria.isOffline', true);
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);
  var snapshot     = record._createSnapshot();
  return localAdapter.createRecord(trashStore, modelType, snapshot);
}

