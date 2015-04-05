# Warning
Currently this addon is still in development yet. We are going to release a
beta version very soon.

# Instruction
### Step1: Install the addons, generate an initializer
```bash
ember addon:install ember-localforage-adapter
ember addon:install ember-fryctoria
ember g reopen-syncer-initializer
```
### Step2: Offline!

# Requirements
ember-data v1.0.0-beta.16.1

# How does it work?
ember-fryctoria utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally.

It always try to connect to the server and fall back to local data when an offline error is caught.

When online, it will use your defalut store, adapter and serializer. After each request to server, it will automatically save records into localforage-adapter.

When offline, it will use the local backup via localforage-adapter to retrive records (e.g. store.find). A queue of jobs is created when the user create, update or delete while offline. When online we flush this queue to keep the server in sync.

**Features NOT supported(yet):**
- Sideloaded records are not saved to localforage automatically, only the main
  records are saved.
- Changes in embeded records will not be pushed to server if you create or update offline
  and try to sync when online. Only the main record will be updated or created.


# How to sync?
An object called *syncer* is responsible for syncing. It is registered into
container and you can get it via *container.lookup('main:syncer')*.

It has a *jobs* property whichs is a queue of operations including create, update and delete. These are your offline operations.

There are two important methods in *syncer*:

- syncUp: push local changes to remote server
- syncDown: save changes from remote server to localforage

In most cases, you do not need to manully sync since ember-fryctoria automatially syncUp before every request to server and automatially syncDown after every request to server.

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

# How to handle errors during syncUp?
By default, when we get an error during syncUp, syncer will stop syncing. In the
next syncUp, syncer will try to start from the failed job. You can change this
behavior by adding a initializer  ```ember g reopen-syncer-initializer```
and add a handleSyncError method in syncer.

For example, you can remove all jobs when you get an error during syncUp. And
then restart your app by ```App.destroy()```,
since the outdated records in ember data store may create
errors when the user try to operate these records.
WARNING: This strategy will remove all the operations by user when he/her
was offline.

IMO, there is really not a single robust way to handle syncing faliure for
a conventional database like SQL combined with ember data. I would recommand you
to only enable user to read while offline. Or you should implement a robust way
to handle syncing errors for a specific app.

# How to decide what is offline?
By default, whenever we have ```error.status === 0```, we define it as offline.
You can overwrite this behavior by overwriting *isOffline* method in the syncer.
Again, you can do this in reopen-syncer initializer ```ember g reopen-syncer-initializer```.
