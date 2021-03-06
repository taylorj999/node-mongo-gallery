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
	var params = {};
	
	// default to excluding all images that have been marked for deletion
	// this will be overridden if the user has passed 'deleted' as a parameter
	params["deleted"] = {'$ne':true};

	if (tags===null) {
		return callback(params);
	} else {
		var tagarray_positive = [];
		var tagarray_negative = [];
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
	options["skip"] = 0;
	
	if (page !== undefined) {
		if (!isNaN(page)) {
			if (page>0) {
				options["skip"] = config.site.imagesPerPage * (page - 1);
			}
		}
	}

	// order by stuff here
	if (orderby === undefined) {
		options["sort"] = {'date':-1};
	} else {
		switch (orderby) {
			case "last":
				options["sort"] = {'last_viewed':1};
				break;
			case "series":
				options["sort"] = {'series.sequence':1};
				break;
			case "recent":
			default:
				options["sort"] = {'date':-1};
				break;
		}
	}
	
	callback(options);
};

Gallery.prototype.getImages = function getImages(params, options, callback) {
	var images = this.images;
	var imgquery = images.find(params,{'thumbnail':true,'tags':true,'series':true});
	imgquery.count(false,function(err,count) {
		if (err) {
			return callback(err);
		} else if (count===0) {
			return callback(null,null,0);
		} else {
			imgquery.sort(options["sort"]).skip(options["skip"]).limit(options["limit"]);
			imgquery.toArray(function(err,results) {
				if (err) {
					return callback(err);
				} else {
					var taglist = {};
					for (x=0;x<results.length;x++) {
						if (results[x].tags !== undefined) {
							for(y=0;y<results[x].tags.length;y++) {
								taglist[results[x].tags[y]]=1;
							}
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
	                         {'$group':{'_id':'series.name','count':{'$sum':1}}}])
	                       .toArray(function(err,result) {
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
	this.images.findOneAndUpdate({'_id':new ObjectId(image_id)}
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

Gallery.prototype.massAddSeries = function massAddSeries(image_ids, series_name, callback) {
	var self=this;
	var upd_ids = image_ids.split(',');
	var obj_upd_ids = upd_ids.map(function(id) { return ObjectId(id); });
	if (series_name===undefined || series_name===null) {
		return callback(null);
	} else {
	  self.images.aggregate([{'$match':{'series.name':series_name,'deleted':{'$ne':true},'_id':{'$not':{'$in':obj_upd_ids}}}},
	                         {'$group':{'_id':'series.name','count':{'$sum':1}}}])
	             .toArray(function(err,result) {
		  if (err) {
   		     return callback(err);
   	      } else {
   	    	  var series_count = 0;
   	    	  if (result.length) { series_count = result[0].count; }
   	    	  doNothing = function doNothing() {};
   	    	  for (var id in upd_ids) {
   	    		  series_count += 1;
   	    		  self.setSequence(upd_ids[id],series_count,series_name,doNothing);
   	    	  }
   	    	  callback(null);
   	      }
	  }); 
	}
};

Gallery.prototype.addTag = function addTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
	                  ,{'$addToSet':{'tags':tag},'$set':{'new':false}}
	                  ,{}
	                  ,callback);
};

Gallery.prototype.massAddTag = function massAddTag(image_ids, tag, callback) {
	var tag_ids = image_ids.split(',');
	tag_ids = tag_ids.map(function(id) { return ObjectId(id); });
	this.images.update({'_id':{'$in':tag_ids}}
					  ,{'$addToSet':{'tags':tag}}
					  ,{'multi':true}
					  ,callback);
};

Gallery.prototype.removeNewFlag = function removeNewFlag(image_ids, callback) {
	var tag_ids = image_ids.split(',');
	tag_ids = tag_ids.map(function(id) { return ObjectId(id); });
	this.images.update({'_id':{'$in':tag_ids}}
					  ,{'$set':{'new':false}}
					  ,{'multi':true}
					  ,callback);
};

Gallery.prototype.removeTag = function removeTag(image_id, tag, callback) {
	this.images.update({'_id':new ObjectId(image_id)}
    				   ,{'$pull':{'tags':tag},'$set':{'new':false}}
    				   ,{}
    				   ,callback);
};

Gallery.prototype.getImage = function getImage(image_id, callback) {
	var images = this.images;
	images.findOneAndUpdate({'_id':new ObjectId(image_id)}
						   ,{'$set':{'last_viewed':new Date()}}
						   ,{'returnOriginal':false}
						   ,callback);
};

Gallery.prototype.getSeriesList = function getSeriesList(page, limit, callback) {
	this.images.aggregate([{'$match':{'deleted':{'$ne':true},'tags':'series','series.name':{'$exists':true}}},
	                       {'$sort':{'series.sequence':1}},
	                       {'$group':{'_id':'$series.name'
	                                 ,'count':{'$sum':1}
	                                 ,'thumbnail':{'$first':'$thumbnail'}
	                                 ,'imageid':{'$first':'$_id'}}},
	                       {'$sort':{'_id':1}}]).toArray(function(err,result) {
							if (err) {
								return callback(err);
							} else {
								var sLength = result.length;
								if (sLength > (page * limit)) {
									result.length = page * limit;
								}
								if (page > 1) {
									result = result.splice((page-1)*limit,(page*limit)-1);
								}
								return callback(null,result,sLength);
							}
						 });
};

Gallery.prototype.getSeriesImage = function getSeriesImage(series, sequence, callback) {
	sequence = sequence * 1;
	this.images.findOneAndUpdate({'series.name':series,'series.sequence':sequence}
								,{'$set':{'last_viewed':new Date()}}
								,{'returnOriginal':false}
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