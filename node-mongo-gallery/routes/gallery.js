var ObjectId = require('mongodb').ObjectID;

function Gallery(db) {
	"use strict";
	
	this.images = db.collection("images");
}

Gallery.prototype.covertTagsToParams = function convertParamsToQuery(tags, callback) {
	if (tags===null) {
		return callback({});
	} else {
		var params = {};
		var tagarray = [];
		var untag = false;
		tags.forEach(function(item) {
			switch(item) {
				case "new":
					params["new"] = true;
					break;
				case "deleted":
					params["deleted"] = true;
					break;
				case "untagged":
					untag = true;
					break;
				default:
					tagarray[tagarray.length] = item;
					break;
			}
		});
		if (untag) {
			params["tags"] = {"$size":0};
		} else if (tagarray.length > 0 ) {
			params["tags"] = {"$all": tagarray};
		}
		return callback(params);
	}
};

Gallery.prototype.buildQueryOptions = function buildQueryOptions(page,orderby,callback) {
	var options = {};
	var thumbsperpage = 20;
	
	options["limit"] = thumbsperpage;
	
	if (page != undefined) {
		if (page != NaN) {
			options["skip"] = thumbsperpage * page;
		}
	}

	// order by stuff here
	if (orderby == undefined) {
		options["sort"] = [['date','desc']];
	}
	
	callback(options);
};

Gallery.prototype.getImages = function getImages(params, options, callback) {
	this.images.find(params,{},options).toArray(function(err,results) {
		callback(err,results);
	});
};

Gallery.prototype.addTag = function addTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
	                  ,{$addToSet:{"tags":tag}}
	                  ,{}
	                  ,callback);
};

Gallery.prototype.removeTag = function removeTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
    				   ,{$pull:{"tags":tag}}
    				   ,{}
    				   ,callback);
};

Gallery.prototype.getImage = function getImage(image_id, callback) {
	this.images.findOne({'_id':new ObjectId(image_id)},{},{},callback);
};

module.exports.Gallery = Gallery;