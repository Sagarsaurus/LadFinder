var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

mongoose.model("User", {temp_id : String, username : String, password : String, email : String, phone : String,  created_at : {type: Date, default: Date.now}});

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
    }


}

router.post('/createUser', api.createUser);
router.get('/getAllUsers', api.getAllUsers);
router.post('/login', api.login);

module.exports = router;

