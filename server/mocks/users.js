var users = [
  { id: 1, name: 'Chun',   age: 27, isActive: true },
  { id: 2, name: 'John',   age: 20, isActive: true },
  { id: 3, name: 'Daniel', age: 18, isActive: false }
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
    var user = req.body.user;
    user.id  = users.length + 1;
    users.push(user);

    res.status(201);
    res.send({
      'users': user
    });
  });

  usersRouter.get('/:id', function(req, res) {
    res.send({
      'users': users[+req.params.id - 1]
    });
  });

  usersRouter.put('/:id', function(req, res) {
    var id   = req.params.id;
    var user = req.body.user;
    user.id = id;
    users[+id - 1] = user;

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
