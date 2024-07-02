const cloudinary=require('cloudinary').v2;
const {CloudinaryStorage}=require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.cloudinary_name,
    api_key:process.env.cloudinary_key,
    api_secret:process.env.cloudinary_secret
})

const storage=new CloudinaryStorage({
    cloudinary,
    params:{
        folder:'TrailBlaze',
        allowedFormats:['jpeg','png','jpg']
    }
})
module.exports={
    cloudinary,
    storage
}