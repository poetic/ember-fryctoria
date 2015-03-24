module.exports = function(app) {
  var express = require('express');
  var jobsRouter = express.Router();
  var jobs = [
    {id: 1, name: 'Mechanical Engineer', salary: 100},
    {id: 2, name: 'Web Developer', salary: 100}
  ];

  jobsRouter.get('/', function(req, res) {
    res.send({
      'jobs': jobs.filter(Boolean)
    });
  });

  jobsRouter.post('/', function(req, res) {
    var job = req.body.job;
    job.id  = jobs.length + 1;
    jobs.push(job);

    res.status(201);
    res.send({
      'jobs': job
    });
  });

  jobsRouter.get('/:id', function(req, res) {
    res.send({
      'jobs': jobs[+req.params.id - 1]
    });
  });

  jobsRouter.put('/:id', function(req, res) {
    var id   = req.params.id;
    var job = req.body.job;
    job.id = id;
    jobs[+id - 1] = job;

    res.send({
      'jobs': {
        id: req.params.id
      }
    });
  });

  jobsRouter.delete('/:id', function(req, res) {
    delete jobs[+req.params.id - 1];
    res.status(204).end();
  });

  app.use('/jobs', jobsRouter);
};
