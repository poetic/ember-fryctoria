import DS from 'ember-data';

export default DS.Store.extend({
  init: function() {
    console.log('Using custom store!');
    return this._super.apply(this, arguments);
  }
});
