module.exports = function(app) {
  var express = require('express');
  var jobsRouter = express.Router();

  jobsRouter.get('/', function(req, res) {
    res.send({
      'jobs': []
    });
  });

  jobsRouter.post('/', function(req, res) {
    res.status(201);
    res.send({
      'job': {id: 1}
    });
  });

  jobsRouter.get('/:id', function(req, res) {
    res.send({
      'jobs': {
        id: req.params.id
      }
    });
  });

  jobsRouter.put('/:id', function(req, res) {
    res.send({
      'jobs': {
        id: req.params.id
      }
    });
  });

  jobsRouter.delete('/:id', function(req, res) {
    res.status(204).end();
  });

  app.use('/jobs', jobsRouter);
};
