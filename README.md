# Instruction
### Step1: Install the addon.
```bash
ember addon:install ember-fryctoria
```
### Step2: Offline!


# How does it work?
ember-fryctoria extends the ember [data store](http://emberjs.com/api/data/classes/DS.Store.html).
It utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally.
Inspired by [ember-sync](https://github.com/kurko/ember-sync) we create a queue of jobs when the user create, update or delete in offline mode. When online we flush this queue to keep the server in sync.

# TODO:
1. <del>create an application store</del>
1. <del>overwrite methods in DS.Store</del>
  1. <del>fetchAll</del>
  1. <del>fetchById</del>
  1. <del>didSaveRecord</del>
  1. <del>createRecord(This does not talk to adapter, we do not care)</del>
  1. <del>deleteRecord(This is just an alias to Model#deleteRecord, we do not care)</del>
1. <del>overwrite methods in DS.Model (If connection error, push to local and queue).
Note: only handle error, since success is handled by didSaveRecord.</del>
  1. <del>createRecord</del>
  1. <del>updateRecord</del>
  1. <del>deleteRecord</del>
1. <del>add a blueprint for applicaiton store</del>
1. <del>save offline jobs to a queue</del>
1. <del>Write a service and a queue to run the jobs</del>
1. <del>Change name: Ember Fryctoria</del>
1. <del>Think of a mechanisem to do syncing</del>
1. <del>Perf, cached jobs in syncer</del>
1. <del>Namespace all custome stuff or put them into functions</del>

1. TODO: write test to make sure belongsTo and hasMany works
1. TODO: think about how to deal with slow internet.
   (Ping?, disadvantage: overhead, not a good predicator of the internet?,
   really interaction can stil be slow.)
1. TODO: when we are syncing, give user a way to show loading screen.
1. TODO: let user decide what kind of error they want to define as offline

1. TODO: Add a blueprint(initializer) to handle syncer error
1. TODO: create a customized adapter and serializer and make sure the addon still works
1. TODO: when we ARE syncing, another call to syncing should return the same
   promise! Then user can safely sync before any request.

1. TODO: patch localforage to save serializer into container in a initializer
1. TODO: add local-forage as a dependency?
1. fork ember-localforage-adapter, remove warning
1. Use configuration to turn on and off logging info
1. Support different serializers
1. Support findQuery
1. Add a throttle option to control syncing
1. A logo
1. move all non-extending functions out of store.js to avoid name collision
1. make local forage a dependency

# Resources:
1. [How ember data store is initialized] (https://github.com/emberjs/data/blob/b8aff0910775f864d6f918ecda1333491a3c001f/packages/ember-data/lib/initializers/store.js)
2. [Ember Data Store] (https://github.com/emberjs/data/blob/1.0.0-beta.15/packages/ember-data/lib/system/store.js#L107)

# Temp:
1. refactor model and store, prepare to integrate syncer
1. add syncer to model

# TODO:
1. Sideload (manul save to local)
1. Do syncing periodically or check if online
1. Refresh local data after create or update
