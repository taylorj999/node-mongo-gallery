var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Download(db) {
	"use strict";
	
	this.dlqueue = db.collection("dlqueue");
}

Download.prototype.queueDownload = function queueDownload(data,callback) {
	this.dlqueue.insert(data, function(err,result) {
		callback(err,result);
	});
};

module.exports.Download = Download;