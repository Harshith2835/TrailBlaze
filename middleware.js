const passport=require('passport');
const { campgroundSchema} = require('./validationschema');
const { reviewvalidationSchema } = require('./validationschema');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

module.exports.isLoggedIn=function(req,res,next){
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        req.flash('error','please login before you add a camp');
        return res.redirect('/login')
    }
    next();
}
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
        delete req.session.returnTo;
    }
    next();
};

module.exports.validateCampground = function (req, res, next) {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.isAuth=async function(req,res,next){
    const {id}=req.params
    const campground=await Campground.findById(id)
    if(!campground.author.equals(req.user._id)){
        req.flash('error','You are not authorized to edit');
        res.redirect(`/campgrounds/${campground._id}`)
    }
    next();
}
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewvalidationSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
module.exports.isreviewAuth=async function(req,res,next){
    const {id,reviewid}=req.params
    const review=await Review.findById(reviewid)
    if(!review.author.equals(req.user._id)){
        req.flash('error','You are not authorized to edit');
        res.redirect(`/campgrounds/${id}`)
    }
    next();
}

