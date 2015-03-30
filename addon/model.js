import DS from 'ember-data';
import decorateAPICall from './stores/main-store/decorate-api-call';

export default DS.Model.extend({
  save: decorateAPICall('single')
});
