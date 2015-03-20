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
1. Use configuration to turn on and off logging info
1. Namespace all custome stuff or put them into functions
1. Support findQuery
1. Write tests
1. A logo
1. move all non-extending functions out of store.js to avoid name collision
1. rewrite adapterFor so that it detect which adapter we should use by checking
   a property on type(which is an object). For now we are maintaining a state
   machine and it is possible that other functions uses that function which is
   not in that state.

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
