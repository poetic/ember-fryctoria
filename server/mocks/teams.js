var teams = [
  { id: 1, name: 'Hurricane' },
  { id: 2, name: 'Typhoon'   },
  { id: 3, name: 'Tsunami'   }
];

module.exports = function(app) {
  var express = require('express');
  var teamsRouter = express.Router();

  teamsRouter.get('/', function(req, res) {
    res.send({
      'teams': teams.filter(Boolean)
    });
  });

  teamsRouter.post('/', function(req, res) {
    var team = req.body.team;
    team.id  = teams.length + 1;
    teams.push(team);

    res.status(201);
    res.send({
      'teams': team
    });
  });

  teamsRouter.get('/:id', function(req, res) {
    res.send({
      'teams': teams[+req.params.id - 1]
    });
  });

  teamsRouter.put('/:id', function(req, res) {
    var id   = req.params.id;
    var team = req.body.team;
    team.id = id;
    teams[+id - 1] = team;

    res.send({
      'teams': {
        id: req.params.id
      }
    });
  });

  teamsRouter.delete('/:id', function(req, res) {
    delete teams[+req.params.id - 1];
    res.status(204).end();
  });

  app.use('/teams', teamsRouter);
};

