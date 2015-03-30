import isOffline from './is-offline';

export default function isOnline(status) {
  return !isOffline(status);
}

