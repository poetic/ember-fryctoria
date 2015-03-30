import DS    from 'ember-data';
import decorateAdapter    from './main-store/decorate-adapter';
import decorateSerializer from './main-store/decorate-serializer';
import decorateAPICall    from './main-store/decorate-api-call';

/**
 * This will be used as store:main
 *
 * @class FryctoriaMainStore
 * @extends DS.Store
 */
export default DS.Store.extend({
  /**
    This method returns a fresh collection from the server, regardless of if there is already records
    in the store or not.
    @method fetchAll
    @param {String or subclass of DS.Model} type
    @return {Promise} promise
  */
  fetchAll: decorateAPICall('all'),

  /*
   * fetchById use the following methods:
   * find -> findById
   * model#reload -> store#reloadRecord
   * NOTE: this will trigger syncUp twice, this is OK. And since this is
   *  a public method, we probably want to preserve this.
   */
  fetchById: decorateAPICall('single'),

  /**
    This method returns a record for a given type and id combination.
    It is Used by:
      #find(<- #fetchById)
      #findByIds(private, orphan)
    @method findById
    @private
    @param {String or subclass of DS.Model} type
    @param {String|Integer} id
    @param {Object} preload - optional set of attributes and relationships passed in either as IDs or as actual models
    @return {Promise} promise
  */
  findById: decorateAPICall('single'),

  /**
   * Used by:
   *   #find
   *   model#reload
   */

  /**
    This method is called by the record's `reload` method.
    This method calls the adapter's `find` method, which returns a promise. When
    **that** promise resolves, `reloadRecord` will resolve the promise returned
    by the record's `reload`.
    @method reloadRecord
    @private
    @param {DS.Model} record
    @return {Promise} promise
  */
  reloadRecord: decorateAPICall('single'),

  adapterFor: function(type) {
    var adapter = this._super(type);
    return decorateAdapter(adapter, this.container);
  },

  serializerFor: function(type) {
    var serializer = this._super(type);
    return decorateSerializer(serializer, this.container);
  },
});
