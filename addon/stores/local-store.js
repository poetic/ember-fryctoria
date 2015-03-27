import DS           from 'ember-data';
import LFAdapter    from 'ember-localforage-adapter/adapters/localforage';
import LFSerializer from 'ember-localforage-adapter/serializers/localforage';

/**
 *
 * @class FryctoriaLocalStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  init: function() {
    var container  = this.get('container');
    var adapter    = LFAdapter.create({ container: container });
    var serializer = LFSerializer.create({ container: container });

    adapter.set('serializer', serializer);
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
