var Gallery = require('./gallery').Gallery;

var index = function(req, res){
	  res.render('index', { title: 'Express Swig Test', username: req.username });
	};
	
module.exports = exports = function(app, db, passport) {
	"use strict";
	
	app.get('/',index);
	
	app.get('/login', function(req,res) {
		res.render('login', { message: req.flash('loginMessage')});
	});

	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the login page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/signup', function(req, res) {
		res.render('signup', { message: req.flash('signupMessage')});
	});
	
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile',{'user':req.user});
	});
	
	app.get('/logout', function(req,res) {
		req.logout();
		res.redirect('/');
	});
	
	app.post('/gallery', function(req,res) {
		var params = {};
		if (req.body.tags !== undefined) {
			params.tags = req.body.tags;
		}
		if (req.body.page !== undefined) {
			params.page = req.body.page;
		}
		if (req.body.sortby !== undefined) {
			params.sortby = req.body.sortby;
		}
		getGallery(params,req,res,db);
	});
	app.get('/gallery', function(req,res) {
		var params = {};
		if (req.query.tags !== undefined) {
			params.tags = req.query.tags;
		}
		if (req.query.page !== undefined) {
			params.page = req.query.page;
		}
		if (req.query.sortby !== undefined) {
			params.sortby = req.query.sortby;
		}
		getGallery(params,req,res,db);
	});
	
	app.get('/image', function(req,res) {
		var gallery = new Gallery(db);
		gallery.getImage(req.query.id, function(err,result) {
			if (err) {
				res.render('image',{'error':err.message
								   ,'image':{}
								   ,'user':req.user});
				return;
			} else {
				res.render('image',{'image':result
								   ,'user':req.user});
				return;
			}
		});
	});
};

function getGallery(query_params,req,res,db) {
	var gallery = new Gallery(db);
	var tags = null;
	if (query_params.tags !== undefined) {
		tags = query_params.tags.split(" ");
	}
	if (query_params.page === undefined) {
		query_params.page = 1;
	}
	gallery.covertTagsToParams(tags, function(params) {
		gallery.buildQueryOptions(query_params.page, query_params.sortby, function(options) {
			gallery.getImages(params, options, function(err, data, count) {
				if (err) {
					res.render('gallery',{'error':err.message 
									 	,'images':{}
									 	,'user':req.user});
					return;
				} else {
					res.render('gallery',{'images':data
									 	,'user':req.user
									 	,'tags':query_params.tags
									 	,'count':count
									 	,'page':query_params.page});
					return;
				}
			});
		});
	});
};

//route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

//route middleware to reject API calls if it doesn't find
//a login session for the requestor
function isLoggedInAPI(req, res, next) {
	if (req.isAuthenticated())
		return next();
	
	res.jsonp({'status':'error','error':'Not logged in.'});
}