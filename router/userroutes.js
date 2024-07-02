const express=require('express')
const router=express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const User=require('../models/user');
const userController=require('../controllers/usersController')
const passport=require('passport');
const { storeReturnTo } = require('../middleware');

router.route('/register')
.get(userController.getRegisterForm)
.post(userController.CreateNewUser);
router.route('/login')
.get(userController.getLoginForm)
.post( storeReturnTo,passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),userController.login);
router.get('/logout', userController.Logout); 
module.exports=router;