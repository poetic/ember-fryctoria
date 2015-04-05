import DS           from 'ember-data';
import LFAdapter    from 'ember-localforage-adapter/adapters/localforage';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';
import generateUniqueId from '../utils/generate-unique-id';

/**
 *
 * @class FryctoriaLocalStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  init: function() {
    var container  = this.get('container');

    var serializer = LFSerializer.create({ container: container });
    var adapter    = LFAdapter
      .extend({generateIdForRecord: generateUniqueId})
      .create({
        container: container,
        serializer: serializer,
        clear: clearLFAdapter
      });

    this.set('adapter', adapter);

    this._super.apply(this, arguments);
  },

  /**
   * Serializer is fetched via this method or adapter.serializer
   *
   * @method serializerFor
   * @public
   */
  serializerFor: function() {
    return this.get('adapter.serializer');
  },

  adapterFor: function() {
    return this.get('adapter');
  },
});

function clearLFAdapter() {
  // clear cache
  var cache = this.get('cache');
  if(cache) {
    cache.clear();
  }

  // clear data in localforage
  return window.localforage.setItem('DS.LFAdapter', []);
}
