var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Tags(db) {
	"use strict";
	
	// we use startsWith to check if tags have been passed with operators
	// so it would be nice to ensure it's actually there
	if ( typeof String.prototype.startsWith != 'function' ) {
		String.prototype.startsWith = function( str ) {
			return str.length > 0 && this.substring( 0, str.length ) === str;
		};
	}
	
	this.images = db.collection("images");
}

Tags.prototype.getTagList = function getTagList(callback) {
	this.images.aggregate([{'$project':{'tags':1}}
						   ,{'$unwind':'$tags'}
						   ,{'$sortByCount':'$tags'}]).toArray(function(err,result) {
							   if (err) {
								   return callback(err,null);
							   } else {
								   return callback(null,result);
							   }
						   });
};

module.exports.Tags = Tags;