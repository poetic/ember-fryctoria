import DS from 'ember-data';

var Team = DS.Model.extend({
  name:  DS.attr('string'),
  users: DS.hasMany('user')
});

export default Team;
