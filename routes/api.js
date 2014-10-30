var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');


mongoose.model("Shared", {userID : String, shareToUserID : String, building : String, floor : String, lat : String, lng : String, timestamp : String});

mongoose.model("Location", {senderID : String, senderUsername : String, lat : String, lng : String, building : String, timestamp : String});

mongoose.model("User", {temp_id : String, username : String, password : String, email : String, phone : String,  timestamp : String, shared : [mongoose.model.Shared], pending : [mongoose.model.Friends], friends : [mongoose.model.Friends], locations : [mongoose.model.Location] });

mongoose.model("Friends", {_id : String, username : String, friendshipStatus: String});

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
                    coll.pending.forEach(function(item) {
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
                                coll.pending.push({_id : req.body.requestedUsername, username : req.body.requestedUsername, friendshipStatus : "Pending"});
                                entity.pending.push({_id : coll.username, username : coll.username, friendshipStatus : "Pending"});
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
                            setFirst.pending.forEach(function(item, index, array) {
                                if(item.username==accepted) {
                                    setFirst.friends.push({username : item.username, friendshipStatus : "Accepted"});
                                    setFirst.markModified('friends');
                                    setFirst.save();
                                }
                            });


                       userModel.findOne({'username' : accepted}, function(err, coll) {
                             if(coll) {
                                coll.pending.forEach(function(item, index, array) {
                                    if(item.username==username) {
                                        coll.friends.push({username : item.username, friendshipStatus : "Accepted"});
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
       var removed = null;
       userModel.findOne({'_id' : req.body.userID}, function(err, coll) {
            if(coll) {
                username = coll.username;
                userModel.findOne({'_id' : req.body.toRemoveUserID}, function(err, remove) {
                if(remove) {
                    removed = remove.username;
                    userModel.findOne({'username' : username}, function(err, setFirst) {
                        if(setFirst) {
                            setFirst.pending.forEach(function(item, index, array) {
                                if(item.username==removed) {
                                    userModel.findOneAndUpdate({username : item.username}, {$pull: {pending : {username : removed}}}, function(err, org) {
                                        console.log(org);
                                    });
                                    setFirst.markModified('pending');
                                    setFirst.save();
                                    console.log(setFirst.pending);

                                }
                            });
                            
                            setFirst.markModified('pending');
                            setFirst.save();

                       userModel.findOne({'username' : removed}, function(err, coll) {
                             if(coll) {
                                coll.pending.forEach(function(item, index, array) {
                                    if(item.username==username) {
                                    userModel.findOneAndUpdate({username : item.username}, {$pull: {pending : {username : username}}}, function(err, org) {
                                        console.log(org);
                                    });
                                    coll.markModified('pending');
                                    coll.save();
                                    console.log(setFirst.pending);
                                    }   
                                });
                                coll.markModified('pending');
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
       var userSchema = mongoose.model('User');
       userSchema.findOne({'_id' : req.body.userID}, function(err, collection) {
            if(collection) {
                userSchema.findOne({'_id' : req.body.shareToUserID}, function(err, coll) {
                    if(coll) {
                        coll.friends.forEach(function(item) {
                            if(item.username == coll.username) {
                                collection.shared.push(toPost);
                                coll.locations.push({senderID : req.body.userID, senderUsername : collection.username, lat : req.body.lat, lng : req.body.lng, timestamp : req.body.timestamp});
                                collection.save();
                                coll.save();
                                res.status(200).send({message : "true"});
                            }
                            else {
                                res.status(500).send({error : "Unable to send to that user"});
                            }
                        });
                    }
                    else {
                        res.status(500).send({error : "User to share with does not exist"});
                    }
                });
            }
            else {
                res.status(500).send({error : "Sending user does not exist"});
            }
       });        
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

