const mongoose=require('mongoose');

let userSchema=mongoose.Schema({
    name:{
      type:String
    },
    email:{
      type:String,
      unique:true
    },
    username:{
      type:String,
      unique:true
    },
    password:{
      type:String
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verifyToken: String,
    verifyTokenExpires:Date,
    verified:Boolean,
    isAdmin:{
      type:Boolean,
      default:false
    },
    facebookId:String
});

var User=mongoose.model('User',userSchema);
module.exports={User};
