const express=require('express')
const router=express.Router();
const catchAsync = require('../utils/catchAsync');
const Campground = require('../models/campground');
const campgroundController=require('../controllers/campgroundController');
const {isLoggedIn,isAuth,validateCampground}=require('../middleware');
const mongoose = require('mongoose');
const campground = require('../models/campground');
const multer  = require('multer');
const {storage}=require('../cloudinary');
const upload = multer({ storage });

router.route('/')
.get(campgroundController.index )
.post(isLoggedIn,upload.array('campground[images]'),validateCampground,campgroundController.CreateNewCamp );

router.get('/new',isLoggedIn, campgroundController.renderNew);

router.route('/:id')
.get(campgroundController.showCamp)
.put(isLoggedIn,isAuth,upload.array('campground[images]'),validateCampground,campgroundController.EditCamp)
.delete(isLoggedIn,isAuth,campgroundController.Delete);


router.get('/:id/edit', isLoggedIn, isAuth,campgroundController.getEditForm)



module.exports=router;