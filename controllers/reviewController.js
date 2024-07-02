const Campground = require('../models/campground');
const Review = require('../models/review');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mongoose = require('mongoose');

module.exports.CreateReview=catchAsync(async (req, res, next) => {
    
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError('Invalid Campground ID', 400);
    }
    const camp = await Campground.findById(id);
    if (!camp) {
        throw new ExpressError('Campground not found', 404);
    }
    const review = new Review(req.body.review);
    review.author=req.user._id
    camp.reviews.push(review);
    await review.save();
    await camp.save();
    req.flash('success','Review uploaded');
    res.redirect(`/campgrounds/${camp._id}`);
})

module.exports.DeleteReview=catchAsync(async(req,res,next)=>{
    const {id,reviewid}=req.params;
    await Campground.findByIdAndUpdate(id,{$pull:{reviews:reviewid}})
    await Review.findByIdAndDelete(reviewid);
    req.flash('success','Successfully deleted the review');
    res.redirect(`/campgrounds/${id}`)
})