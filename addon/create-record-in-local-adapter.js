export default function createRecordInLocalAdapter(store, type, record) {
  // localAdapter.createRecord uses store#serialize to serialize records
  // store#serialize is using the adapter from the trashStore(localAdapter)
  // serialize: function(record, options) {
  //   var snapshot = record._createSnapshot();
  //   return this.serializerFor(snapshot.typeKey).serialize(snapshot, options);
  // },

  // TODO:
  // give trashStore localForage Serializer? overwrite this.serializerFor
  // in trashStore.
  var localAdapter = store.get('fryctoria.localAdapter');
  var trashStore   = store.get('fryctoria.trashStore');
  var modelType    = store.modelFor(type);
  var snapshot     = record._createSnapshot();
  return localAdapter.createRecord(trashStore, modelType, snapshot);
}

