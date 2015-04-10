# Warning
Now the addon is in alpha, please help by reporting bugs and opening issues.

# Instruction
### Step1: Install the addons, generate an initializer
```bash
ember install ember-localforage-adapter
ember install ember-fryctoria
ember g reopen-syncer-initializer
```
### Step2: Offline!

# Requirements
ember-data v1.0.0-beta.16.1

# How does it work?
ember-fryctoria utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally.

It always try to connect to the server and fall back to local data when an offline error is caught.

When online, it will use your defalut store, adapter and serializer. After each request to server, it will automatically save records into localforage-adapter.

When offline, it will use the local backup(localforage) to retrive records. A queue of jobs is created when the user create, update or delete while offline. When online we flush this queue to keep the server in sync.

**Features NOT supported(yet):**
- Sideloaded records are not saved to localforage automatically, only the main
  records are saved. [Here](https://github.com/poetic/ember-fryctoria/issues/2) is a work around.
- Changes in embeded records will not be pushed to server if you create or update offline
  and try to sync when online. Only the main record will be updated or created.
- Customized transforms are not supported, see work around [here](https://github.com/poetic/ember-fryctoria/issues/1).


# How to sync?
An object called *syncer* is responsible for syncing.
- It is registered into *container*, therefore you can get syncer like this
```javascript
container.lookup('main:syncer')
```

- It is also injected into main *store*, therefore you can get syncer like this
```javascript
store.get('syncer')
```

It has a *jobs* property whichs is a queue of operations including create, update and delete. These are your offline operations.

There are two important methods in *syncer*:

- syncUp: push local changes to remote server, flush the queue of jobs.
- syncDown: save data in main *store* into localforage.
```javascript
syncer.syncDown('user');         // remove all records in localforage and save all current user records into localforage
syncer.syncDown(user);           // create or update user record into localforage
syncer.syncDown([user1, user2]); // create or update user records into localforage
```

### Automatic sync
In most cases, you do not need to manully sync since ember-fryctoria automatially
*syncUp* before every request to server and automatially
*syncDown* after every request to server.
```javascript
store.find('user')         // syncDown('user') is called.
store.fetchAll('user')     // syncDown('user') is called.
store.find('user', 1)      // syncDown(user) is called.
store.fetchById('user', 1) // syncDown(user) is called.
user.reload()              // syncDown(user) is called.
```

### Manual sync
When you sideload or embed records, you probably want to manully save sideloaded or embeded records to localforage. Also you may want to syncUp periodially. In these cases, you can manully syncDown or syncUp.


# How to handle errors during syncUp?
By default, when we get an error during syncUp, syncer will stop syncing. In the
next syncUp, syncer will retry starting from the failed job.

You can customize this by overwriting *handleSyncUpError* method in syncer in
reopen-syncer-initializer.

IMO, there is really not a single robust way to handle syncing faliure for
a conventional database like SQL combined with ember data. I would recommand you
to only enable user to read while offline. Or you should implement a robust way
to handle syncing errors for your app.

# How to decide what is offline?
By default, offline is defined by ```jqXHR && jqXHR.status === 0```.
[jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR)

You can overwrite this by overwriting *isOffline* method in syncer in
reopen-syncer-initializer.
