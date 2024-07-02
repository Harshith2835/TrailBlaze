const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Campground = require('../models/campground');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mongoose = require('mongoose');
const {cloudinary}=require('../cloudinary');
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = catchAsync(async (req, res, next) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
});

module.exports.renderNew = (req, res, next) => {
    res.render('campgrounds/new');
};
module.exports.CreateNewCamp = catchAsync(async (req, res,next) => {
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    const camp = new Campground(req.body.campground);
    camp.geometry = geoData.features[0].geometry;
    camp.images=req.files.map(f=>({url:f.path,filename:f.filename}))
    camp.author = req.user._id;
    await camp.save();
    req.flash('success', "Successfully created the camp");
    res.redirect(`/campgrounds/${camp._id}`);
});

module.exports.showCamp = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError('Invalid Campground ID', 400);
    }
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', "Can't find the campground");
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
});

module.exports.getEditForm = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError('Invalid Campground ID', 400);
    }
    const campground = await Campground.findById(id);
    if (!campground) {
        throw new ExpressError('Campground not found', 404);
    }
    res.render('campgrounds/edit', { campground });
});

module.exports.EditCamp = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError('Invalid Campground ID', 400);
    }
    const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    camp.geometry = geoData.features[0].geometry;
    const imgs=req.files.map(f=>({url:f.path,filename:f.filename}))
    camp.images.push(...imgs)
    await camp.save()
    if(req.body.deleteImages){
        // for(let filename of req.body.deleteImages){
        //     cloudinary.uploader.destroy(fileanme);
        // }
        await camp.updateOne({$pull:{images:{filename:{$in:req.body.deleteImages}}}})
    }
    req.flash('success', 'Successfully updated the camp');
    res.redirect(`/campgrounds/${camp._id}`);
});

module.exports.Delete = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError('Invalid Campground ID', 400);
    }
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the camp');
    res.redirect('/campgrounds');
});
