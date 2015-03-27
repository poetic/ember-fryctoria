import FryctoriaLocalStore from '../stores/local-store';

export function initialize(container, application) {
  application.register('store:local', FryctoriaLocalStore);
}

export default {
  name:       'local-store',
  before:     'syncer',
  initialize: initialize
};
