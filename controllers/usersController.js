const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const mongoose = require('mongoose');
const User=require('../models/user');
const passport=require('passport');
const { storeReturnTo } = require('../middleware');

module.exports.getRegisterForm=async(req,res,next)=>{
    res.render('users/register')
}
module.exports.CreateNewUser=catchAsync(async(req,res,next)=>{
    try{
    const {email,username,password}=req.body.user;
    const newuser=new User({email,username})
    const registeredUser=await User.register(newuser,password);
    req.login(registeredUser, err=>{
        if(err) return next(err);
        req.flash('success','welcome to trailblaze');
        res.redirect('/campgrounds');
    })
    }
    catch(e){
        req.flash('error',e.message);
        res.redirect('/register')
    }
})
module.exports.getLoginForm=async(req,res,next)=>{
    res.render('users/login');
}
module.exports.login=catchAsync(async(req,res,next)=>{
    req.flash('success',"Logged in Successfully");
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    res.redirect(redirectUrl);
})
module.exports.Logout=(req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}