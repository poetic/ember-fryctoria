import Syncer from '../syncer';

export function initialize(container, application) {
  application.register('syncer:main', Syncer);
  application.inject('store:main', 'syncer', 'syncer:main');
  application.inject('model',      'syncer', 'syncer:main');
}

export default {
  name:       'syncer',
  before:     'ember-data',
  after:      'extend-ds-model',
  initialize: initialize
};
