import Ember from 'ember';
import isOffline from './is-offline';

export default function backup(backupFn, args) {
  return function(error) {
    var isOnline = !isOffline(error && error.status);
    if(isOnline) {
      return Ember.RSVP.reject(error);
    }

    return backupFn.apply(null, args);
  };
}
