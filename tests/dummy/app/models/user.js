import DS from 'ember-data';

var User = DS.Model.extend({
  name: DS.attr('string'),
  age:  DS.attr('number'),
  isActive: DS.attr('boolean', {defaultValue: false}),
  team: DS.belongsTo('team'),
});

export default User;
