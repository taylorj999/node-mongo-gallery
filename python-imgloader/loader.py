import os
from os.path import isfile, join
import pymongo
from PIL import Image
from pymongo import MongoClient
from bson.objectid import ObjectId
import datetime
import shutil
import argparse

# directory locations
input_dir = "C:/Development/images/input"
thumbnail_dir = "C:/Development/images/images/thumbnails"
done_dir = "C:/Development/images/images"

# parse the command line arguments to see if there are
# any default tags specified
parser = argparse.ArgumentParser()
parser.add_argument('--dt',action='append')
args = parser.parse_args()
if args.dt != None:
	tags = args.dt
else:
	tags = []

client = MongoClient()
db = client.gallery
coll = db.images

onlyfiles = [ f for f in os.listdir(input_dir) if isfile(join(input_dir,f)) ]

for fName in onlyfiles:
     im = Image.open(join(input_dir,fName))
     new_id = ObjectId()
     str_id = str(new_id)
     imgname = str_id + "." + im.format
     thumbname = "thumbnail-" + imgname
     # check if the destination directories exist
     # create them if they do not
     # subdirs are used so we're not dumping 1000s of images
     # in one directory
     if os.access(join(done_dir,str_id[:8]),os.R_OK) == False:
     	os.mkdir(join(done_dir,str_id[:8]))
     if os.access(join(thumbnail_dir,str_id[:8]),os.R_OK) == False:
     	os.mkdir(join(thumbnail_dir,str_id[:8]))
     # create thumbnail
     s1 = im.size[0]
     s2 = im.size[1]
     if s1 >= s2:
     	n1 = 150
     	n2 = (150 * s2) / s1
     else:
     	n2 = 150
     	n1 = (150 * s1) / s2
     thumbsize = (n1,n2)
     thumbtype = im.format
     im.thumbnail(thumbsize, Image.ANTIALIAS)
     im.save(join(thumbnail_dir,str_id[:8],thumbname),thumbtype)
     # save image document to database
     imgdoc = {"_id" : new_id,
			   "date" : datetime.datetime.utcnow(),
			   "original" : fName,
			   "new" : True,
			   "location" : str_id[:8] + "/" + imgname,
			   "thumbnail" : str_id[:8] + "/" + thumbname,
			   "x" : s1,
			   "y" : s2,
			   "tags" : tags}
     coll.insert(imgdoc)
     # and finally move the old file to the new location and name
     del im
     shutil.move(join(input_dir,fName),join(done_dir,str_id[:8],imgname))