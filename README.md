# Instruction
### Step1: Install the addon.
```bash
ember addon:install ember-ice-sync
```
### Step2: Offline!


# How does it work?
IceSync extends the ember [data store](http://emberjs.com/api/data/classes/DS.Store.html).
It utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally.
Inspired by [ember-sync](https://github.com/kurko/ember-sync) we create a queue of jobs when the user create, update or delete in offline mode. When online we flush this queue to keep the server in sync.

# TODO:
1. create an application store
1. overwrite methods in DS.Store
  1. <del>fetchAll</del>
  1. <del>fetchById</del>
  1. <del>didSaveRecord</del>
  1. <del>createRecord(This does not talk to adapter, we do not care)</del>
  1. <del>deleteRecord(This is just an alias to Model#deleteRecord, we do not care)</del>
1. overwrite methods in DS.Model (If connection error, push to local and queue).
Note: only handle error, since success is handled by didSaveRecord.
  1. createRecord
  1. updateRecord
  1. deleteRecord
1. add a blueprint for applicaiton store

# Resources:
1. [How ember data store is initialized] (https://github.com/emberjs/data/blob/b8aff0910775f864d6f918ecda1333491a3c001f/packages/ember-data/lib/initializers/store.js)
2. [Ember Data Store] (https://github.com/emberjs/data/blob/1.0.0-beta.15/packages/ember-data/lib/system/store.js#L107)

# Temp:
Get all methods we need to overwrite
