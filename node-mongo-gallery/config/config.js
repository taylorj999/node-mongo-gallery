var config = {};

// system configuration, used to define back end features
// anything that never is required by the Swig layer goes in here
config.system = {};

config.system.mongoConnectString = 'mongodb://localhost:27017/gallery';
config.system.sessionKey = 'insertyoursecrethere';
config.system.galleryServerPort = 3000;

// site configuration, used to build pages or allow/disallow actions globally
// anything that needs to be passed to the Swig layer goes in here
config.site = {};

// number of thumbnails to show per page
config.site.imagesPerPage = 20;

module.exports = config;