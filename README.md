# Warning
Currently this addon is still in development yet. We are going to release a
beta version very soon.

# Instruction
### Step1: Install the addon.
```bash
ember addon:install ember-fryctoria
```
### Step2: Offline!

# Requirements
ember-data v1.0.0-beta.16.x


# How does it work?
ember-fryctoria utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally.

It always try to connect to the server and fall back to local data when an offline error is caught.

When online, it will use your defalut store, adapter and serializer. After each request to server, it will automatically save records into localforage-adapter.

When offline, it will use the local backup via localforage-adapter to retrive records (e.g. store.find). A queue of jobs is created when the user create, update or delete while offline. When online we flush this queue to keep the server in sync.

# How to sync?
An object called *syncer* is responsible for syncing. In most cases, you do not need to manully sync since ember-fryctoria automatially syncUp(push local changes to remote server) before every request to server and automatially syncDown(save changes from remote server to localforage) after every request to server.

However, when you sideload or embed records, you probably want to manully save sideloaded or embeded records to localforage. Also you may want to syncUp periodially. In these cases, you can manully syncDown or syncUp.

*syncer* is injected into store. So you can do this to flush the queue of jobs:
```javascript
store.syncer.syncUp();
```
You can also capture records into localforage from ember-data store by doing this:
```javascript
store.syncer.syncDown('user'); // remove all records in localforage and save all current user records in localforage
store.syncer.syncDown(user); // create or update user record into localforage
store.syncer.syncDown([user1, user2]); // create or update user records into localforage
```
