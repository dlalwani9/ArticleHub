const mongoose=require('mongoose');

let userSchema=mongoose.Schema({
    name:{
      type:String,
      required:true
    },
    email:{
      type:String,
      required:true,
      unique:true
    },
    username:{
      type:String,
      required:true,
      unique:true
    },
    password:{
      type:String,
      required:true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verifyToken: String,
    verifyTokenExpires:Date,
    verified:Boolean
});

var User=mongoose.model('User',userSchema);
module.exports={User};
