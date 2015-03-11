import DS from 'ember-data';
import IceModel from '../model';

export function initialize(/* container, application */) {
  DS.set('Model', IceModel);
}

export default {
  name:       'extend-ds-model',
  before:     'store',
  initialize: initialize
};
