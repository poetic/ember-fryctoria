var users = [
  { id: 1, name: 'Chun', age: 27 },
  { id: 2, name: 'John', age: 20 },
  { id: 3, name: 'Daniel', age: 18 }
];

module.exports = function(app) {
  var express = require('express');
  var usersRouter = express.Router();

  usersRouter.get('/', function(req, res) {
    res.send({
      'users': users.filter(Boolean)
    });
  });

  usersRouter.post('/', function(req, res) {
    res.status(201);
    res.send({
      'users': {id: users.length + 1}
    });
  });

  usersRouter.get('/:id', function(req, res) {
    res.send({
      'users': users[+req.params.id - 1]
    });
  });

  usersRouter.put('/:id', function(req, res) {
    res.send({
      'users': {
        id: req.params.id
      }
    });
  });

  usersRouter.delete('/:id', function(req, res) {
    delete users[+req.params.id - 1];
    res.status(204).end();
  });

  app.use('/users', usersRouter);
};
