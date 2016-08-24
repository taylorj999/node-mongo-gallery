var config = {};

// system configuration, used to define back end features
// anything that never is required by the display layer goes in here
config.system = {};

config.system.mongoConnectString = 'mongodb://localhost:27017/gallery';
config.system.sessionKey = 'insertyoursecrethere';
config.system.galleryServerPort = 3000;

// reserved tag keywords, things which are inferred and never assigned directly
config.system.reservedTags = ['new','deleted','untagged'];

// site configuration, used to build pages or allow/disallow actions globally
// anything that needs to be passed to the display layer goes in here
config.site = {};

// number of thumbnails to show per page
config.site.imagesPerPage = 20;

// comment permissions
config.site.allowComments = true;
config.site.allowAnonymousComments = true;

module.exports = config;