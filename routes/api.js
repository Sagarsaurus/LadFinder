var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

mongoose.model("User", {temp_id : String, username : String, password : String, email : String, phone : String,  timestamp : String, shared : [Shared], friends : [Friends], locations : [Location] });

mongoose.model("Shared", {userID : String, shareToUserID : String, building : String, floor : String, lat : String, lng : String, timestamp : String});

mongoose.model("Location", {senderId : String, senderUsername : String, lat : String, lng : String, building : String, timestamp : String});

var Friends = new mongoose.Schema({username : String, friendshipStatus: String,});

mongoose.model("Friends", Friends);

mongoose.model("Friendships", {username : String, friends : [Friends]});

var api = {
    createUser : function(req, res) {
        var model = mongoose.model('User');
        var insertContent = req.body;
        var toPost = new model(insertContent);
        model.findOne({'username' : req.body.username}, function(err, coll) {
            if(coll) {
                res.status(500).send({error : 'Username already taken'});
            }

            else {
                model.findOne({'email' : req.body.email}, function(err, emails) {
                    if(emails) {
                        res.status(500).send({error : "Email is already registered under another account"});
                    }

                    else {
                        model.findOne({'phone' : req.body.phone}, function(err, phone) {
                            if(phone) {
                                res.status(500).send({error : "Phone number is already registered under another account"});

                            }

                            else {
                                 toPost.save(function(err, resource) {
                                        if (err != null) {
                                            res.status(500).send({error:err});
                                        }

                                        else {

                                            return model.find({'username' : req.body.username}, 'username email phone timestamp', function(err,coll) {
                                                res.send(coll);
                                            });
                                        }

                                });

                                }
                            });
                        }
                    });
                }
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
    sendFriendRequest : function(req, res) {
       var userModel = mongoose.model("User");
       userModel.findOne({'_id' : req.body.userID}, function(err, coll) {
          var found = false;
          if(coll) {
                 if(coll.username == req.body.requestedUsername) {
                    res.status(500).send({error : "You cannot send yourself a friend request"});
                 }
                 
                 else {
                    coll.friends.forEach(function(item) {
                        if(item.username==req.body.requestedUsername) {
                            found = true;
                        }
                    });

                    if(found) {
                        res.status(500).send({error : "You've already sent this person a friend request"});
                    }

                    else {
                        userModel.findOne({'username' : req.body.requestedUsername}, function(err, entity) {
                            if(!entity) {
                                res.status(500).send({error : "No user found with that username"});
                            }

                            else {
                                coll.friends.push({username : req.body.requestedUsername, friendshipStatus : "Pending"});
                                entity.friends.push({username : coll.username, friendshipStatus : "Pending"});
                                coll.save();
                                entity.save();
                                res.status(200).send({message: "true"});
                            }
                        });
                    }
                 }
          }
          else {
            res.status(500).send({error : "Unable to send friend request"});
          }
        });
    },

    getFriends : function(req, res) {
        var model = mongoose.model("User");
        return model.findOne({'_id' : req.params.userID}, 'friends', function(err,coll) {
            if(!coll) {
                res.status(500).send({error : "Unable to get list of friends"});
            }
            else {            
                return res.send(coll);
            }
        });
    },

    acceptFriendRequest : function(req, res) {
       var userModel = mongoose.model("User");
       var username = null;
       var accepted = null;
       userModel.findOne({'_id' : req.body.userID}, function(err, coll) {
            if(coll) {
                username = coll.username;
                userModel.findOne({'_id' : req.body.acceptedUserID}, function(err, accept) {
                if(accept) {
                    accepted = accept.username;

                    userModel.findOne({'username' : username}, function(err, setFirst) {
                        if(setFirst) {
                            setFirst.friends.forEach(function(item, index, array) {
                                if(item.username==accepted) {
                                    item.friendshipStatus = "Accepted";
                                    setFirst.markModified('friends');
                                    setFirst.save();
                                }
                            });


                       userModel.findOne({'username' : accepted}, function(err, coll) {
                             if(coll) {
                                coll.friends.forEach(function(item, index, array) {
                                    if(item.username==username) {
                                        item.friendshipStatus="Accepted";
                                        coll.markModified('friends');
                                        coll.save();
                                        res.status(200).send({message: "true"});
                                   }
                                });
                            }

                            else {
                                res.status(500).send({error : "No such user exists"});
                            }
                        });

                        }

                        else {
                            res.status(500).send({error : "No such user exists"});
                        }
                    });

                }

                else {
                    res.status(500).send({error : "No such user exists"});
                }
            });
        }
      });

    },

    removeFriendRequest : function(req, res) {
       var userModel = mongoose.model("User");
       var username = null;
       var accepted = null;
       userModel.findOne({'_id' : req.body.userID}, function(err, coll) {
            if(coll) {
                username = coll.username;
                userModel.findOne({'_id' : req.body.acceptedUserID}, function(err, accept) {
                if(accept) {
                    accepted = accept.username;
                    userModel.findOne({'username' : username}, function(err, setFirst) {
                        if(setFirst) {
                            setFirst.friends.forEach(function(item, index, array) {
                                if(item.username==accepted) {
                                    setFirst.friends.remove({username : accepted});
                                }
                            });
                            setFirst.markModified('friends');
                            setFirst.save();

                       userModel.findOne({'username' : accepted}, function(err, coll) {
                             if(coll) {
                                coll.friends.forEach(function(item, index, array) {
                                    if(item.username==username) {
                                        coll.friends.remove({username : username});
                                   }
                                });
                                coll.markModified('friends');
                                coll.save();
                                res.status(200).send({message : "true"});
                            }

                            else {
                                res.status(500).send({error : "No such user exists"});
                            }
                        });

                        }

                        else {
                            res.status(500).send({error : "No such user exists"});
                        }
                    });

                }

                else {
                    res.status(500).send({error : "No such user exists"});
                }
            });
        }
      });

    },

    listSharedLocations : function(req, res) {
        var model = mongoose.model('User');
        model.findOne({'_id' : req.params.userID}, function(err, coll) {
            if(coll) {
                res.send(coll.locations);
            }

            else {
                res.status(500).send({message : "Unable to get list of locations shared with you"});
            }
        });
    },

    shareLocation : function(req, res) {
       var shareSchema = mongoose.model('Shared');
       toPost = new shareSchema(req.body);
        
    }
}


router.post('/createUser', api.createUser);
router.get('/getAllUsers', api.getAllUsers);
router.post('/login', api.login);
router.post('/sendFriendRequest', api.sendFriendRequest);
router.get('/getFriends/:userID', api.getFriends);
router.post('/acceptFriendRequest', api.acceptFriendRequest);
router.post('/removeFriendRequest', api.removeFriendRequest);
router.get('/listSharedLocations/:userID', api.listSharedLocations);

module.exports = router;

