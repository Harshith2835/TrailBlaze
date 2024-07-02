const express=require('express')
const router=express.Router({mergeParams:true});
const Review = require('../models/review');
const {isLoggedIn,validateReview,isreviewAuth}=require('../middleware')
const reviewController=require('../controllers/reviewController');

router.post('/', isLoggedIn,validateReview,reviewController.CreateReview )
router.delete('/:reviewid',isLoggedIn,isreviewAuth,reviewController.DeleteReview)

module.exports=router;