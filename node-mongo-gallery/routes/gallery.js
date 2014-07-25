var ObjectId = require('mongodb').ObjectID
   ,config = require('../config');

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

	options["limit"] = config.site.imagesPerPage;
	
	if (page !== undefined) {
		if (!isNaN(page)) {
			if (page>0) {
				options["skip"] = config.site.imagesPerPage * (page - 1);
			}
		}
	}

	// order by stuff here
	if (orderby === undefined) {
		options["sort"] = [['date','desc']];
	}
	
	callback(options);
};

Gallery.prototype.getImages = function getImages(params, options, callback) {
	var images = this.images;
	images.find(params).count(function(err, count){
		if (err) {
			return callback(err);
		} else if (count===0) {
			return callback(null,null,0);
		} else {
			images.find(params,{},options).toArray(function(err,results) {
				callback(err,results,count);
			});
		}
	});
};

Gallery.prototype.addTag = function addTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
	                  ,{'$addToSet':{'tags':tag},'$set':{'new':false}}
	                  ,{}
	                  ,callback);
};

Gallery.prototype.removeTag = function removeTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
    				   ,{'$pull':{'tags':tag},'$set':{'new':false}}
    				   ,{}
    				   ,callback);
};

Gallery.prototype.getImage = function getImage(image_id, callback) {
	this.images.findOne({'_id':new ObjectId(image_id)},{},{},callback);
};

module.exports.Gallery = Gallery;