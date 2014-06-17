
function Gallery(db) {
	"use strict";
	
	this.images = db.collection("images");
}

Gallery.prototype.covertTagsToParams = function convertParamsToQuery(tags, callback) {
	if (tags===null) {
		return callback({});
	} else {
		var params = {};
		params.tags = [];
		tags.forEach(function(item) {
			console.log(item);
			switch(item) {
				case "new":
					params["new"] = true;
					break;
				case "deleted":
					params["deleted"] = true;
					break;
				case "untagged":
					params["tags"] = {"$size":0};
					break;
				default:
					params.tags[params.tags.length] = item;
					break;
			}
		});
	}
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

module.exports.Gallery = Gallery;