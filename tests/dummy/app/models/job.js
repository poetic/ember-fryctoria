import DS from 'ember-data';

var Job = DS.Model.extend({
  user:   DS.belongsTo('user'),
  name:   DS.attr('string'),
  salary: DS.attr('number')
});

export default Job;

