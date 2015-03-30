import DS               from 'ember-data';

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
      .then(syncDown);
  }
});

// TODO: There is unncecssary update when we use localforage adapter
function syncDown(record) {
  var localAdapter = record.get('container').lookup('store:local').get('adapter');
  var snapshot     = record._createSnapshot();

  if(record.get('isDeleted')) {
    localAdapter.deleteRecord(null, snapshot.type, snapshot);
  } else {
    localAdapter.createRecord(null, snapshot.type, snapshot);
  }

  return record;
}
