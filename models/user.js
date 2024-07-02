const mongoose = require('mongoose');
const passportlocalmongoose = require('passport-local-mongoose');
const Schema=mongoose.Schema;

const userSchema=new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
});
userSchema.plugin(passportlocalmongoose);
module.exports=mongoose.model('user',userSchema);
