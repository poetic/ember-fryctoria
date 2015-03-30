import backup           from '../utils/backup';
import isObject         from '../utils/is-object';
import generateUniqueId from '../utils/generate-unique-id';

/*
 * Extend adapter so that we can use local adapter when offline
 */
export default function decorateAdapter(adapter, container) {
  if(adapter.get('fryctoria')) {
    return adapter;
  }

  adapter.set('fryctoria', {});

  var localAdapter = container.lookup('store:local').get('adapter');

  // find()
  // findAll()
  // findQuery()
  // findMany()
  // createRecord()
  // updateRecord()
  // deleteRecord()
  var methods = [
    'find', 'findAll', 'findQuery', 'findMany',
    'createRecord', 'updateRecord', 'deleteRecord'
  ];

  methods.forEach(function(methodName) {
    decorateAdapterMethod(adapter, localAdapter, methodName);
  });

  return adapter;
}

function decorateAdapterMethod(adapter, localAdapter, methodName) {
  var originMethod = adapter[methodName];
  var backupMethod = function() {

    var args = Array.prototype.slice.call(arguments);

    var crudMethods = ['createRecord', 'updateRecord', 'deleteRecord'];
    var isCRUD = crudMethods.indexOf(methodName) !== -1;
    // ---------- CRUD
    if(isCRUD) {
      var snapshot = args[2];
      var syncer = adapter.container.lookup('syncer:main');
      var record = snapshot.record;

      // Add an id to record before create in local
      if(methodName === 'createRecord') {
        record.get('store').updateId(record, {id: generateUniqueId()});
        snapshot = record._createSnapshot();
      }

      // decorate snapshot for serializer#serialize
      snapshot.fryctoria = true;
      syncer.createJob(record);
    }
    // ---------- CRUD END

    return localAdapter[methodName].apply(localAdapter, args)
      .then(function(payload) {
        // decorate payload for serializer#extract
        if(isObject(payload)) {
          payload.fryctoria = true;
        }
        return payload;
      });
  };

  adapter[methodName] = function() {
    return originMethod.apply(adapter, arguments).catch(backup(backupMethod, arguments));
  };

  adapter.fryctoria[methodName] = originMethod;
}
