var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

mongoose.model("User", {temp_id : String, username : String, password : String, email : String, phone : String,  timestamp : String });

var Friends = new mongoose.Schema({friend : String, phone: String, email : String});

mongoose.model("Friends", Friends);

mongoose.model("Friendships", {username : String, friends : [Friends]});

var api = {
    createUser : function(req, res) {
        var model = mongoose.model('User');
        var insertContent = req.body;
        var toPost = new model(insertContent);
        return toPost.save(function(err, resource) {
            if (err != null) {
                res.status(500).send({error:err});
            }

            return res.send(resource);
        });
    },

    getAllUsers : function(req, res) {
        var model = mongoose.model('User');
        return model.find({}, function(err, coll) {
            return res.send(coll);
        });
    },

    login : function(req, res) {
        var model = mongoose.model('User');
        return model.findOne({'username' : req.body.username, 'password' : req.body.password}, 'username email phone', function(err, coll) {
            if(!coll) {
                res.status(500).send({error : "Invalid username and/or password"});
            }
            else {
                return res.send(coll);
            }
        });
    },
    addFriend : function(req, res) {
       var friendShipModel = mongoose.model("Friendships");
       var friendShip = new friendShipModel(req.body);
       return friendShipModel.findOne({'username' : req.body.username}, function(err, coll) {
          if(coll) {
                 coll.friends.push({friend : req.body.friend, email : req.body.email, phone : req.body.phone});
                 coll.save();
                 return res.send(coll);
          }
          else {
              friendShip.save();
              friendShip.friends.push({friend: req.body.friend, email : req.body.email, phone : req.body.phone});
              return res.send(friendShip);
          }
        });
    },

    getFriends : function(req, res) {
        var friendShipModel = mongoose.model("Friendships");
        return friendShipModel.findOne({'username' : req.params.username}, 'friends', function(err,coll) {
            if(!coll) {
                res.status(500).send({error : "Sorry, that user does not have any friendships!"});
            }
            else {            
                return res.send(coll);
            }
        });
    }
}


router.post('/createUser', api.createUser);
router.get('/getAllUsers', api.getAllUsers);
router.post('/login', api.login);
router.post('/addFriend', api.addFriend);
router.get('/getFriends/:username', api.getFriends);

module.exports = router;

