var animals = [
  { id: 1, nick_name: 'Lili'   },
  { id: 2, nick_name: 'Xiaohu' },
  { id: 3, nick_name: 'Xiaobao'}
];

module.exports = function(app) {
  var express = require('express');
  var animalsRouter = express.Router();

  animalsRouter.get('/', function(req, res) {
    res.send({
      'animals': animals.filter(Boolean)
    });
  });

  animalsRouter.post('/', function(req, res) {
    var animal = req.body.animal;
    animal.id  = animals.length + 1;
    animals.push(animal);

    res.status(201);
    res.send({
      'animals': animal
    });
  });

  animalsRouter.get('/:id', function(req, res) {
    res.send({
      'animals': animals[+req.params.id - 1]
    });
  });

  animalsRouter.put('/:id', function(req, res) {
    var id   = req.params.id;
    var animal = req.body.animal;
    animal.id = id;
    animals[+id - 1] = animal;

    res.send({
      'animals': {
        id: req.params.id
      }
    });
  });

  animalsRouter.delete('/:id', function(req, res) {
    delete animals[+req.params.id - 1];
    res.status(204).end();
  });

  app.use('/animals', animalsRouter);
};
