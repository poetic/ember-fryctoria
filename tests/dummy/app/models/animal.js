import DS from 'ember-data';

var Animal = DS.Model.extend({
  nickName: DS.attr('string'),
});

export default Animal;


