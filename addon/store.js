import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';

export default DS.Store.extend({
  init: function() {
    this._super.apply(this, arguments);
  },

  fetchAll: function() {
    return this._super.apply(this, arguments);
  }
});
