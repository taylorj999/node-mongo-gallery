var Gallery = require('./gallery').Gallery
   ,Comments = require('./comments').Comments
   ,Tags = require('./tags').Tags
   ,config = require('../config/config')
   ,validator = require('validator')
   ,sanitizers = require('../config/sanitizers');

module.exports = exports = function(app, db, passport) {
	"use strict";
	
	app.get('/',function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "index";
		res.render('index', pageParams);
	});
	
	app.get('/login', function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "login";
		pageParams["errorMsg"] = req.flash('loginMessage');
		res.render('login', pageParams);
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the login page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/signup', function(req, res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "signup";
		pageParams["errorMsg"] = req.flash('signupMessage');
		res.render('signup', pageParams);
	});
	
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/profile', isLoggedIn, function(req, res){
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "profile";
		res.render('profile',pageParams);
	});
	
	app.get('/logout', function(req,res) {
		req.logout();
		res.redirect('/');
	});
	
	app.post('/gallery', function(req,res) {
		var params = {};
		if (req.body.tags !== undefined) {
			params.tags = sanitize(req.body.tags, sanitizers.allow_spaces).toLowerCase();
		}
		if (req.body.page !== undefined) {
			params.page = sanitize(req.body.page);
		}
		if (req.body.sortby !== undefined) {
			params.sortby = sanitize(req.body.sortby).toLowerCase();
		}
		if (req.body.series !== undefined) {
			params.series = sanitize(req.body.series, sanitizers.allow_spaces);
		}
		getGallery(params,req,res,db);
	});
	app.get('/gallery', function(req,res) {
		var params = {};
		if (req.query.tags !== undefined) {
			params.tags = sanitize(req.query.tags, sanitizers.allow_spaces).toLowerCase();
		}
		if (req.query.page !== undefined) {
			params.page = sanitize(req.query.page);
		}
		if (req.query.sortby !== undefined) {
			params.sortby = sanitize(req.query.sortby).toLowerCase();
		}
		if (req.query.series !== undefined) {
			params.series = sanitize(req.query.series, sanitizers.allow_spaces);
		}
		getGallery(params,req,res,db);
	});
	
	app.get('/image', function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "image";
		var gallery = new Gallery(db);
		if ((req.query.id === undefined)&&(req.query.series === undefined)) {
			pageParams["errorMsg"] = "Invalid parameter error";
			res.render('image',pageParams);
		} else if (req.query.id === undefined) {
			gallery.getSeriesImage(sanitize(req.query.series, sanitizers.allow_spaces)
					              ,sanitize(req.query.sequence)
					              ,function(err,result) {
									if (err) {
										pageParams["errorMsg"] = err.message;
										pageParams["data"] = {};
									} else {
										pageParams["data"] = result.value;
									}
									return res.render('image', pageParams);
			});
		} else {
			gallery.getImage(sanitize(req.query.id).toLowerCase(), function(err,result) {
				if (err) {
					pageParams["errorMsg"] = err.message;
					pageParams["data"] = {};
			    } else {
			    	pageParams["data"] = result.value;
			    }
				return res.render('image', pageParams);
			});
		}
	});
	
	app.get('/taglist', function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "tags";
		var tags = new Tags(db);
		tags.getTagList(function (err, result) {
			if (err) {
				pageParams["errorMsg"] = err.message;
			} else {
				pageParams["data"] = result;
			}
			return res.render('tags', pageParams);
		});
	});

	app.post('/serieslist', function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "serieslist";
		var gallery = new Gallery(db);
		var page = 1;
		if (req.body.seriespage !== undefined) {
			page = sanitize(req.body.seriespage);
		}
		gallery.getSeriesList(page,
							  config.site.imagesPerPage,
				              function (err, result, count) {
			if (err) {
				pageParams["errorMsg"] = err.message;
			} else {
				pageParams["data"]["count"] = count;
				pageParams["data"]["serieslist"] = result;
				pageParams["search"]["page"] = page;
			}
			return res.render('serieslist', pageParams);
		});
	});
	app.get('/serieslist', function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "serieslist";
		var gallery = new Gallery(db);
		var page = 1;
		if (req.query.seriespage !== undefined) {
			page = sanitize(req.query.seriespage);
		}
		gallery.getSeriesList(page,
							  config.site.imagesPerPage,
	              			  function (err, result, count) {
			if (err) {
				pageParams["errorMsg"] = err.message;
			} else {
				pageParams["data"]["count"] = count;
				pageParams["data"]["serieslist"] = result;
				pageParams["search"]["page"] = page;
				console.log(JSON.stringify(pageParams));
			}
			return res.render('serieslist', pageParams);
		});
	});

	
	app.post('/addComment',function(req,res) {
		let pageParams = getDefaultParameters(req);
		pageParams["page"] = "image";
		var comments = new Comments(db);
		comments.addComment(req.user
				           ,sanitize(req.body.comment,sanitizers.comments)
				           ,sanitize(req.body.id).toLowerCase()
				           ,function(err,result) {
			if (err) {
				pageParams["errorMsg"] = err.message;
				pageParams["data"] = {};
		    } else {
		    	pageParams["data"] = result.value;
		    }
			return res.render('image', pageParams);
		});
	});
	
	app.get('/addtag-api', function(req,res) {
		if ((req.query.id === undefined)||(req.query.newtag === undefined)) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else if (config.system.reservedTags.indexOf(sanitize(req.query.newtag).toLowerCase()) >= 0) {
			res.jsonp({'status':'error','error':'Reserved keyword.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.addTag(sanitize(req.query.id).toLowerCase()
					      ,sanitize(req.query.newtag).toLowerCase()
					      ,function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success','tag':sanitize(req.query.newtag).toLowerCase()});
					return;
				} 
			});
		}
	});

	app.get('/setsequence-api', function(req,res) {
		if ((req.query.id === undefined)||(req.query.sequence === undefined)||isNaN(req.query.sequence)) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.setSequence(sanitize(req.query.id).toLowerCase()
					           ,sanitize(req.query.sequence)
					           ,sanitize(req.query.series_name, sanitizers.allow_spaces)
					           ,function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				} 
			});
		}
	});
	
	app.get('/removetag-api', function(req,res) {
		if ((req.query.id === undefined)||(req.query.tag === undefined)) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.removeTag(sanitize(req.query.id).toLowerCase()
					         ,sanitize(req.query.tag).toLowerCase()
					         ,function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success', 'tag':sanitize(req.query.tag)});
					return;
				} 
			});
		}
	});

	app.get('/markdeleted-api', function(req,res) {
		if (req.query.id === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.markDeleted(sanitize(req.query.id).toLowerCase(), function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				} 
			});
		}
	});
	
	app.get('/markundeleted-api', function(req,res) {
		if (req.query.id === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.markUnDeleted(sanitize(req.query.id).toLowerCase(), function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				} 
			});
		}
	});

	app.get('/tagmass-api', function(req,res) {
		if (req.query.ids === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else if (config.system.reservedTags.indexOf(sanitize(req.query.newtag).toLowerCase()) >= 0) {
			res.jsonp({'status':'error','error':'Reserved keyword in tag.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.massAddTag(sanitize(req.query.ids,sanitizers.allow_commas).toLowerCase(),
							   sanitize(req.query.newtag).toLowerCase(),
							   function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				}
			});
		}
	});
	
	app.get('/seriesmass-api', function(req,res) {
		if (req.query.ids === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.massAddSeries(sanitize(req.query.ids,sanitizers.allow_commas).toLowerCase(),
							      sanitize(req.query.seriesname,sanitizers.allow_spaces).toLowerCase(),
							      function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				}
			});
		}
	});
	
	app.get('/removenewflag-api',function(req,res) {
		if (req.query.ids === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.removeNewFlag(sanitize(req.query.ids,sanitizers.allow_commas).toLowerCase(),
							      function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				}
			});
		}
	});
	
	app.get('/autogenseriesnumber-api',function(req,res) {
		if (req.query.series_name === undefined) {
			res.jsonp({'status':'error','error':'Invalid parameter error.'});
			return;
		} else {
			var gallery = new Gallery(db);
			gallery.autoGenSeriesNumber(sanitize(req.query.series_name,sanitizers.allow_spaces),
										function(err) {
				if (err) {
					res.jsonp({'status':'error','error':err.message});
					return;
				} else {
					res.jsonp({'status':'success'});
					return;
				}
			});
		}
	});
};

function getGallery(query_params,req,res,db) {
	let pageParams = getDefaultParameters(req);
	pageParams["page"] = "image";
	var gallery = new Gallery(db);
	var tags = null;
	if (query_params.tags !== undefined) {
		if (query_params.tags.length > 0) {
			tags = query_params.tags.split(" ");
		}
	}
	if (query_params.page === undefined) {
		query_params.page = 1;
	}
	gallery.covertTagsToParams(tags, function(params) {
		if (query_params.series !== undefined) {
			params["series.name"] = query_params.series;
			if (query_params.sortby === undefined) {
				query_params.sortby = "series";
			}
		}
		gallery.buildQueryOptions(query_params.page, query_params.sortby, function(options) {
			gallery.getImages(params, options, function(err, data, count, taglist) {
				if (err) {
					pageParams["errorMsg"] = err.message;
					pageParams["data"] = {};
				} else {
					pageParams["data"]["images"] = data;
					pageParams["data"]["count"] = count;
					pageParams["data"]["taglist"] = taglist;
					pageParams["search"]["tags"] = query_params.tags;
					pageParams["search"]["sortby"] = query_params.sortby;
					pageParams["search"]["series"] = query_params.series;
					pageParams["search"]["page"] = query_params.page;
				}
				return res.render('gallery', pageParams);
			});
		});
	});
};

function getDefaultParameters(req) {
	let defaultObj = {
		'page':'',
		'errorMsg':'',
		'config':config.site,
		'user':null,
		'search':{},
		'data':{}
	};
	if (hasValue(req.user)) {
		defaultObj["user"] = req.user;
	}
	return defaultObj;
}

function hasValue(varValue) {
	if (varValue === undefined) {
		return false
	} else if (varValue === null) {
		return false;
	} else if (typeof varValue === 'string' && varValue.length==0) {
		return false;
	} else {
		return true;
	}
}

//input sanitization; this should cover the majority of user input fields
//the sanitizers are defined in /config/sanitizers.js
function sanitize(x, sanitizer) {
	if (sanitizer === undefined) {
		return validator.whitelist(x,sanitizers.standard);
	} else {
		return validator.whitelist(x,sanitizer);
	}
}

//route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

//route middleware to reject API calls if it doesn't find
//a login session for the requester
function isLoggedInAPI(req, res, next) {
	if (req.isAuthenticated())
		return next();
	
	res.jsonp({'status':'error','error':'Not logged in.'});
}