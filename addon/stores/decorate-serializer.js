/*
 * Extend serializer so that we can use local serializer when local adater is
 * userd.
 */
export default function decorateSerializer(serializer, container) {
  if(serializer.get('isFryctorized')) {
    return serializer;
  }

  var localSerializer = container.lookup('store:local').get('adapter.serializer');

  // * extract()
  // serializer()
  // normalize()
  decorateSerializerExtract(serializer, localSerializer);

  serializer.set('isFryctorized', true);

  return serializer;
}

function decorateSerializerExtract(serializer, localSerializer) {
  var originMethod = serializer['extract'];
  var backupMethod = function() {
    var args = Array.prototype.slice.call(arguments);
    args[2] = args[2].payload;
    return localSerializer['extract'].apply(localSerializer, args);
  };

  serializer['extract'] = function() {
    var payload = arguments[2];

    if(payload && payload.isFryctorized) {
      return backupMethod.apply(localSerializer, arguments);
    } else {
      return originMethod.apply(serializer, arguments);
    }
  };
}
