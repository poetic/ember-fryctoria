import backup           from '../../utils/backup';
import isObject         from '../../utils/is-object';
import generateUniqueId from '../../utils/generate-unique-id';

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
  var backupMethod = createBackupMethod(localAdapter, methodName);

  adapter[methodName] = function() {
    return originMethod.apply(adapter, arguments).catch(backup(backupMethod, arguments));
  };

  adapter.fryctoria[methodName] = originMethod;
}

function createBackupMethod(localAdapter, methodName) {
  var container   = localAdapter.container;
  var crudMethods = ['createRecord', 'updateRecord', 'deleteRecord'];
  var isCRUD      = crudMethods.indexOf(methodName) !== -1;
  var isCreate    = methodName === 'createRecord';

  return function backupMethod() {
    var args = Array.prototype.slice.call(arguments);

    if(isCRUD) {
      var snapshot = args[2];

      if(isCreate) {
        snapshot = addIdToSnapshot(snapshot);
      }

      createJobInSyncer(container, methodName, snapshot);

      // decorate snapshot for serializer#serialize, this should be after
      // createJob in syncer
      snapshot.fryctoria = true;
    }

    return localAdapter[methodName].apply(localAdapter, args)
      .then(function(payload) {
        // decorate payload for serializer#extract
        if(isObject(payload)) {
          payload.fryctoria = true;
        }
        return payload;
      });
  };
}

// Add an id to record before create in local
function addIdToSnapshot(snapshot) {
  var record = snapshot.record;
  record.get('store').updateId(record, {id: generateUniqueId()});
  return record._createSnapshot();
}

function createJobInSyncer(container, methodName, snapshot) {
  var syncer = container.lookup('syncer:main');
  syncer.createJob(methodName, snapshot);
}
