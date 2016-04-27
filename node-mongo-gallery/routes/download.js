var ObjectId = require('mongodb').ObjectID
   ,config = require('../config/config');

function Download(db) {
	"use strict";
	
	this.download = db.collection("download");
}

Download.prototype.queueDownload = function queueDownload(data,callback) {
	this.download.insert(data, function(err,result) {
		callback(err,result);
	});
};

module.exports.Download = Download;