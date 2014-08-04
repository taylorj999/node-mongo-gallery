var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Comments(db) {
	"use strict";
		
	this.images = db.collection("images");
}

Comments.prototype.addComment = function addComment(user, comment, image_id, callback) {
	var commentObj = {'comment':comment, 'date':new Date()};
	if ((user === undefined)&&(!config.site.allowAnonymousComments)) {
		return callback(new Error("Anonymous comments not allowed."));
	} else if (user===undefined) {
		commentObj.user = "Anonymous";
	} else {
		commentObj.user = user.local.email;
	}
	this.images.findAndModify({'_id':new ObjectId(image_id)}
    						 ,[]
    						 ,{'$addToSet':{'comments':commentObj}}
    						 ,{'new':true}
    						 ,callback);
};

module.exports.Comments = Comments;