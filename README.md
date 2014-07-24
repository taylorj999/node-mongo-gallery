node-mongo-gallery
==================

A simple node gallery application designed to sit atop a MongoDB back end. At the moment the use case is large numbers of images, so it utilizes a python script to load images from an input directory. Once in the system, images can be tagged in more detail. Utilizes the node passport library for user authentication, if desired (TODO: add ability to comment, level restrictions on actions).

##Setup
* Assumes you already have a MongoDB instance running on the standard port.
* Clone the repository using your preferred means.
* You will need to create an image input, image output, and thumbnail directory under the image output in the locale of your choice. This should probably not be under the application directory. These directory locations can be configured in the preferences file. You will need to make a link to the image output directory in the same spot that the app.js is running (this will require 'mklink /H' for Windows).
* The Python image loader requires several libraries to be able to create image thumbnails and connect to Mongo. You will need to install the Pillow image library and pymongo. Due to version compatibility on the libraries, this will require running no later a version than Python 3.3 (as of this writeup, July 2014).

##Uses
* [simplePagination.js](https://github.com/flaviusmatis/simplePagination.js)
* [jquery 1.11.1](http://jquery.com/)
