var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Gallery(db) {
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

Gallery.prototype.covertTagsToParams = function convertParamsToQuery(tags, callback) {
	if (tags===null) {
		return callback({});
	} else {
		var params = {};
		var tagarray_positive = [];
		var tagarray_negative = [];
		var untag = false;
		
		// default to excluding all images that have been marked for deletion
		// this will be overridden if the user has passed 'deleted' as a parameter
		params["deleted"] = {'$ne':true};
		
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
					if (item.startsWith('-')) {
						tagarray_negative[tagarray_negative.length] = item.substring(1,item.length);
					} else {
						tagarray_positive[tagarray_positive.length] = item;
					}
					break;
			}
		});
		// build the query for tags; we have to account for searching for untagged images,
		// as well as searching by positive, negative or both kinds of matching
		if (untag) {
			params["tags"] = {"$size":0};
		} else if ((tagarray_positive.length > 0) && (tagarray_negative.length === 0) ) {
			params["tags"] = {"$all": tagarray_positive};
		} else if ((tagarray_positive.length === 0) && (tagarray_negative.length > 0) ) {
			params["tags"] = {"$not" : {"$all" : tagarray_negative}};
		} else if ((tagarray_positive.length > 0) && (tagarray_negative.length > 0)) {
			params["$and"] = [{"tags" : {"$all": tagarray_positive}}, {"tags":{"$not" : {"$in" : tagarray_negative}}}];
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
	} else {
		switch (orderby) {
			case "last":
				options["sort"] = [['last_viewed','asc']];
				break;
			case "series":
				options["sort"] = [['series.sequence','asc']];
				break;
			case "recent":
			default:
				options["sort"] = [['date','desc']];
				break;
		}
	}
	
	callback(options);
};

Gallery.prototype.getImages = function getImages(params, options, callback) {
	var images = this.images;
	var imgquery = images.find(params,{'thumbnail':true,'tags':true},options);
	imgquery.count(function(err,count) {
		if (err) {
			return callback(err);
		} else if (count===0) {
			return callback(null,null,0);
		} else {
			imgquery.toArray(function(err,results) {
				if (err) {
					return callback(err);
				} else {
					var taglist = {};
					for (x=0;x<results.length;x++) {
						for(y=0;y<results[x].tags.length;y++) {
							taglist[results[x].tags[y]]=1;
						}
					}
					callback(err,results,count,Object.keys(taglist));
				}
			});
		}
	});
};

Gallery.prototype.updateSeriesCount = function updateSeriesCount(series_name, callback) {
	var self=this;
	if (series_name===undefined || series_name===null) {
		return callback(null);
	} else {
	  self.images.aggregate([{'$match':{'series.name':series_name,'deleted':{'$ne':true}}},
	                         {'$group':{'_id':'series.name','count':{'$sum':1}}}]
	                       ,function(err,result) {
	        	   if (err) {
	        		   return callback(err);
	        	   } else if (result[0].count===0) {
	        		   return callback(null);
	        	   } else {
	        		   self.images.update({'series.name':series_name}
	        			   				 ,{'$set':{'series.count':result[0].count}}
	        			   				 ,{'multi':true}
	        		   					 ,callback);
	        	   }
	           });
	}
};

Gallery.prototype.setSequence = function setSequence(image_id, sequence, series_name, callback) {
	sequence = sequence*1; // explicitly type to integer
	var self=this;
	this.images.findAndModify({'_id':new ObjectId(image_id)}
						     ,{}
	                         ,{'$set':{'series.sequence':sequence,
	                	               'series.name':series_name}}
	                         ,{}
	                         ,function(err,object) {
	                        	 if (err) {
	                        		 return callback(err);
	                        	 } else {
	                        		 // update the count for the series to maintain denormalization
	                        		 // with better data integrity this could be updated
	                        		 // to check only when the series name is changed
	                        		 // but this way it will 'clean up' any entries without counts
	                        		 var old_name;
	                        		 if (object.series === undefined) {
	                        			 old_name = null;
	                        		 } else {
	                        			 old_name = object.series.name;
	                        		 }
	                        		 self.updateSeriesCount(old_name
	                        				               ,function (err) {
		                        			 				 if (err) {
			                        			 				return callback(err);
			                        			 			 } else if (series_name != old_name){
			                        			 				self.updateSeriesCount(series_name
			                        			 			  			              ,callback);
			                        			 			 } else {
			                        			 				return callback(null);
			                        			 			 }
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
//	this.images.findOne({'_id':new ObjectId(image_id)},{},{},callback);
	var images = this.images;
	images.findAndModify({'_id':new ObjectId(image_id)}
	                    ,[]
	                    ,{'$set':{'last_viewed':new Date()}}
	                    ,{'new':true}
	                    ,callback);
};

Gallery.prototype.getSeriesImage = function getSeriesImage(series, sequence, callback) {
	sequence = sequence * 1;
	this.images.findAndModify({'series.name':series,'series.sequence':sequence}
							  ,[]
							  ,{'$set':{'last_viewed':new Date()}}
							  ,{'new':true}
							  ,callback);
};

Gallery.prototype.markDeleted = function markDeleted(image_id, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
    				  ,{'$set':{'deleted':true}}
    				  ,{}
    				  ,callback);
};

Gallery.prototype.markUnDeleted = function markUnDeleted(image_id, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
					  ,{'$set':{'deleted':false}}
    				  ,{}
    				  ,callback);
};

module.exports.Gallery = Gallery;