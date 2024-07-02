const mongoose=require('mongoose');
const schema=mongoose.Schema;

const reviewSchema=new schema({
    body:String,
    rating:Number,
    author:{
        type:schema.Types.ObjectId,
        ref:'user'
    }
});
const review=mongoose.model('review',reviewSchema);
module.exports=review;