/*
 * Extend serializer so that we can use local serializer when local adater is
 * userd.
 */
export default function decorateSerializer(serializer) {
  return serializer;
}

