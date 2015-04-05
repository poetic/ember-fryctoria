import Ember from 'ember';

export default function backup(isOffline, backupFn, args) {
  return function(error) {
    if(isOffline(error)) {
      return backupFn.apply(null, args);
    } else {
      return Ember.RSVP.reject(error);
    }
  };
}
