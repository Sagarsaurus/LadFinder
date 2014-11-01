var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');


mongoose.model("Shared", {userID : String, shareToUserID : String, building : String, floor : String, lat : String, lng : String, timestamp : String});

mongoose.model("Location", {senderID : String, senderUsername : String, lat : String, lng : String, building : String, timestamp : String});

mongoose.model("User", {temp_id : String, username : String, password : String, email : String, phone : String,  timestamp : String, shared : [mongoose.model.Shared], locations : [mongoose.model.Location] });

mongoose.model("Friendship", {userID : String, requestedID : String, requestedUsername : String, friendshipStatus: String});

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
       var friendshipModel = mongoose.model("Friendship");
       var userModel = mongoose.model('User');
       userModel.findOne({'username' : req.body.requestedUsername}, function(err, coll) {
          var found = false;
          if(coll) {
                var id = coll._id;
                friendshipModel.findOne({'userID' : req.body.userID, 'requestedID' : id}, function(err, collection){
                    if(collection) {
                        if(collection.friendshipStatus == 0) {
                            res.status(500).send({error : "You have already sent that user a friend request"});
                        }
                        else if(collection.friendshipStatus==1) {
                            res.status(500).send({error : "You are already friends with that user"});
                        }
                    }

                    else {
                        var friendship = new friendshipModel({userID : req.body.userID, requestedID : id, requestedUsername : req.body.requestedUsername, friendshipStatus : 0});
                        friendship.save();
                        res.send(id);                            
                    }

                });
            }
            else {
                res.status(500).send({error : "A user with that username does not exist"});
            }
        });  
    },

    getFriends : function(req, res) {
        var model = mongoose.model("Friendship");
        return model.find({'userID' : req.body.userID}, 'userID requestedUsername friendshipStatus', function(err,coll) {
            if(!coll) {
                res.status(500).send({error : "Unable to get list of friends"});
            }
            else {            
                return res.send(coll);
            }
        });
    },

    acceptFriendRequest : function(req, res) {
       var friendshipModel = mongoose.model("Friendship");
       friendshipModel.findOne({'userID' : req.body.userID, 'requestedID' : req.body.acceptedUserID}, function(err, coll) {
            if(coll) {
                if(coll.friendshipStatus==0) {
                    coll.friendshipStatus=1;
                    coll.save();
                    res.status(200).send({message : true});
                }
                else if(coll.friendshipStatus==1) {
                    res.status(500).send({error : "You are already friends with this user"});
                }
            }
            else {
                res.status(500).send({error : "Unable to accept this friend request"});
            }
        });       
    },

    removeFriendRequest : function(req, res) {
       var model = mongoose.model('Friendship');
       model.remove({userID : req.body.userID, requestedID : req.body.toRemoveUserID}, function(err) {
            if(err) {
                res.status(500).send({error : "Unable to remove friend request"});
            }
            else {
                res.status(200).send({message : true});
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
       var friendshipSchema = mongoose.model('Friendship');
       userSchema.findOne({'_id' : req.body.userID}, function(err, collection) {
            if(collection) {
                userSchema.findOne({'_id' : req.body.shareToUserID}, function(err, coll) {
                    if(coll) {
                        friendshipSchema.findOne({userID : req.body.userID, requestedID : req.body.shareToUserID}, function(err, friendship) {
                            if(friendship) {
                                if(friendship.friendshipStatus==1) {
                                    collection.shared.push(toPost);
                                    coll.locations.push({senderID : req.body.userID, senderUsername : collection.username, lat : req.body.lat, lng : req.body.lng, timestamp : req.body.timestamp});
                                    collection.save();
                                    coll.save();
                                    res.status(200).send({message : true});
                                }
                                else {
                                    res.status(500).send({error : "Unable to send to that user"});
                                }
                            }
                            else {
                                res.status(500).send({error : "There is no friendship between yourself and the other user"});
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
router.post('/getFriends', api.getFriends);
router.post('/acceptFriendRequest', api.acceptFriendRequest);
router.post('/removeFriendRequest', api.removeFriendRequest);
router.get('/listSharedLocations/:userID', api.listSharedLocations);
router.post('/shareLocation', api.shareLocation);

module.exports = router;

