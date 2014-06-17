
/**
 * Module dependencies.
 */

var express = require('express')
  , MongoClient = require('mongodb').MongoClient
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , consolidate = require('consolidate')
  , swig = require('swig')
  , app = express()
  , passport = require('passport')
  , flash 	 = require('connect-flash');

MongoClient.connect('mongodb://localhost:27017/gallery', function(err, db) {
    "use strict";
    if(err) throw err;

    // load passport configuration
    require('./config/passport')(passport,db);

    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.static(path.join(__dirname, "images")));
    
    // Register our templating engine
    app.engine('html', consolidate.swig);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    
    // Express middleware to populate 'req.cookies' so we can access cookies
    app.use(express.cookieParser());

    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());

    app.use(express.session({secret: 'insertyoursecrethere'}));
    app.use(passport.initialize());
    app.use(passport.session());
	app.use(flash()); // use connect-flash for flash messages stored in session

//    app.use(express.logger('dev'));
    // Application routes
    routes(app, db, passport);

//    app.get('/', routes.index);
    
    app.set('port', process.env.PORT || 3000);
    app.listen(app.get('port'), function() {
    	console.log('Express server listening on port ' + app.get('port'));
    });
});