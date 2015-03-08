# Instruction
```bash
ember addon:install ember-free-sync
```
That's it.

# How does it work?
FreeSync extends the ember [data store](http://emberjs.com/api/data/classes/DS.Store.html). It utilizes [ember-localforage-adapter](https://github.com/genkgo/ember-localforage-adapter/) to read and write locally. Inspired by [ember-sync](https://github.com/kurko/ember-sync) we create a queue of jobs when the user create, update or delete in offline mode. And flush this queue when online to keep sync the server.

# TODO:
1. overwrite methods in DS.Store

