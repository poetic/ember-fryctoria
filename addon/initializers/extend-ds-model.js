import DS from 'ember-data';
import FryctoriaModel from '../model';

export function initialize(/* container, application */) {
  DS.set('Model', FryctoriaModel);
}

export default {
  name:       'extend-ds-model',
  before:     'store',
  initialize: initialize
};
