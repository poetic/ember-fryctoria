// This is independent of state of store.fryctoria.isOffline
export default function createRecordInLocalAdapter(store, type, record) {
  var container    = store.container;
  var localAdapter = container.lookup('store:local').get('adapter');
  var modelType    = store.modelFor(type);
  var snapshot     = record._createSnapshot();
  return localAdapter.createRecord(null, modelType, snapshot);
}

