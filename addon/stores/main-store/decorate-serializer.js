import isObject from '../../utils/is-object';

/*
 * Extend serializer so that we can use local serializer when local adater is
 * userd.
 */
export default function decorateSerializer(serializer, container) {
  if(serializer.get('fryctoria')) {
    return serializer;
  }

  serializer.set('fryctoria', true);

  var localSerializer = container.lookup('store:local').get('adapter.serializer');

  // serialize()
  // extract()
  // normalize() is not used in localforage adapter, so we do not decorate
  decorateSerializerMethod(serializer, localSerializer, 'serialize', 1);
  decorateSerializerMethod(serializer, localSerializer, 'extract',   2);
  // decorateSerializerMethod(serializer, localSerializer, 'normalize', 2);

  return serializer;
}

function decorateSerializerMethod(serializer, localSerializer, methodName, wrappedArgIndex) {
  var originMethod = serializer[methodName];
  var backupMethod = function() {
    // remove fryctoria from arg
    var args = Array.prototype.slice.call(arguments);
    delete args[wrappedArgIndex].fryctoria;

    return localSerializer[methodName].apply(localSerializer, args);
  };

  serializer[methodName] = function() {
    var payload = arguments[wrappedArgIndex];

    if(isObject(payload) && payload.fryctoria) {
      return backupMethod.apply(localSerializer, arguments);
    } else {
      return originMethod.apply(serializer, arguments);
    }
  };
}
