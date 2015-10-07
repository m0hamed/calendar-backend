var express = require('express');
var utils = require('../components/utils.js');
var router = express.Router();

var mongo = require('mongoskin');
var ID = mongo.helper.toObjectID;
var db = mongo.db('mongodb://localhost:27017/calendar');
var calendars = db.collection('calendars');
var user;

router.all('*', function(req, res, next) {
  var auth_token = ID(req.params.auth_token);
  db.collection('users').find({auth_token: auth_token})
    .toArray(function(err, result) {
      console.log(result);
      if(result.length==0) res.status(403).send('Invalid authentication token used!' + 
                                               'Are you trying something nasty?');
      else {
        user = result[0];
        next();
      }
    });
});

router.all('/.+', function(req, res, next) {
  utils.auth_user(user._id, req.params.id).then(function(isAuth) {
    if (isAuth) next();
    else res.status(403).send('Access Forbidden');
  });
});

router.post('/', function(req, res, next) {
  console.log(req.params);
  console.log(req.body);
  calendars.insert(_.extend(req.body, {"user_id": user.id}), function(err, result) {
    if(!err) res.send('Inserted ' + req.body.name+"\n result="
                        +JSON.stringify(result));
    else res.send('Failed to insert ' + req.body.name+
                  '\n result='+JSON.stringify(err)+"\n");
  });
});

router.get('/', function(req, res, next) {
  calendars.find({"user_id": user._id}).toArray(function(err, result) {
    res.send(result);
  });
});

router.post('/:id', function(req, res, next) {
  console.log(req.params, req.body);
  calendars.update(
    {_id: ID(req.params.id)},
    req.body,
    function(err, result) {
      if (!err) res.send('Updated ' + req.params.id + "\n result=" +
                         JSON.stringify(result));
        else res.send('Error, Can\'t update: ' + err);
    });
});

router.delete('/:id', function(req, res, next) {
  calendars.remove(
    {_id: ID(req.params.id)},
    function(err, result) {
      if(!err) res.send('Deleted ' + req.params.id+"\n result="+JSON.stringify(result));
      else res.send('Error, Can\'t delete: ' + err);
    });
});


module.exports = router;
