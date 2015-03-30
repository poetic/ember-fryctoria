import backup from '../utils/backup';

/*
 * Extend adapter so that we can use local adapter when offline
 */
export default function decorateAdapter(adapter, container) {
  if(adapter.get('isFryctorized')) {
    return adapter;
  }

  var localAdapter = container.lookup('store:local').get('adapter');

  // createRecord()
  // updateRecord()
  // deleteRecord()
  // * find()
  // * findAll()
  // * findQuery()
  // * findMany()
  var finders = ['find', 'findAll', 'findQuery', 'findMany'];
  finders.forEach(function(methodName) {
    decorateAdapterFinder(adapter, localAdapter, methodName);
  });

  adapter.set('isFryctorized', true);

  return adapter;
}

function decorateAdapterFinder(adapter, localAdapter, methodName) {
  var originMethod = adapter[methodName];
  var backupMethod = function() {
    return localAdapter[methodName].apply(localAdapter, arguments)
      .then(function(payload) {
        return {
          payload:       payload,
          isFryctorized: true
        };
      });
  };

  adapter[methodName] = function() {
    return originMethod.apply(adapter, arguments).catch(backup(backupMethod, arguments));
  };
}
