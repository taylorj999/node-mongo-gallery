var bcrypt  = require('bcrypt-nodejs')
	,ObjectId = require('mongodb').ObjectID;

//user:
//	_id:
//	local:
//		email:
//		password: (hashed)

function User(db) {
	"use strict";
	
	var users = db.collection("users");

	this.findById = function(id, callback) {
		"use strict";
		
		if(!id) {
			callback(Error("No session ID provided"), null);
		}
		
		users.findOne({'_id':new ObjectId(id)}, function(err, user) {
			if (err) return callback(err, null);
			
			if (!user) {
                callback(new Error("User ID: " + id + " does not exist"), null);
                return;
            }

            callback(null, user);
		});
	};
	
	this.checkExists = function(email, callback) {
		"use strict";
		
		if(!email) {
			callback(Error("No email provided"), null);
		}
		
		users.findOne({'local.email':email}, function(err, user) {
			if (err) return callback(err, null);
			
			if (!user) {
				callback(null, null);
				return;
			}
			
            callback(null, user);
		});
	};
	
	this.generateHash = function(password) {
	    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	};

	this.createUser = function(email,passwordHash,callback) {
		var newUser = {local:{'email':email, 'password':passwordHash}};
		users.insert(newUser,function(err,result) {
			callback(err,result[0]);
		});
	};
	
	this.checkPassword = function(user,password) {
		if (bcrypt.compareSync(password,user.local.password)) {
			return true;
		} else {
			return false;
		}
	};
	
}

module.exports.User = User;