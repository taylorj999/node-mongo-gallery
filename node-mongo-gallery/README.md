node-mongo-gallery
==================

A simple node gallery application designed to sit atop a MongoDB back end. At the moment the use case is large numbers of images being loaded in batches, so it utilizes a python script to load images from an input directory rather than uploading individually. Once in the system, images can be tagged in more detail. Utilizes the node passport library for user authentication, in order to track edits.

##Setup
* Assumes you already have a MongoDB instance installed. You can configure the location in config/config.js
* Clone the repository using your preferred means.
* You will need to create an image input, image output, and thumbnail directory under the image output in the location of your choice. By default the thumbnail directory is assumed to be under the main image directory. These locations can all be configured in /config/directory.json The image storage directory should probably not be under the application directory. If so you will need to make a link to the image output directory in the same spot that the app.js is running (this will require 'mklink /H' for Windows).
* The Python image loader requires several libraries to be able to create image thumbnails and connect to Mongo. You will need to install the Pillow image library and pymongo. Due to version compatibility on the libraries, this will require running no later a version than Python 3.3 (as of this writeup, July 2014).

##Uses
* [simplePagination.js](https://github.com/flaviusmatis/simplePagination.js)
* [jquery 1.11.1](http://jquery.com/)
* [imagesloaded](https://github.com/desandro/imagesloaded)