const express=require('express');
const router=express.Router();
const {User}=require('../models/user');
const bcrypt=require('bcryptjs');
const passport=require('passport');

router.get('/register',(req,res)=>{
  res.render('register');
});

router.post('/register',(req,res)=>{
  var name=req.body.name;
  var username=req.body.username;
  var email=req.body.email;
  var password=req.body.password;
  var password2=req.body.password2;

  req.checkBody('name','Name is required').notEmpty();
  req.checkBody('username','Username is required').notEmpty();
  req.checkBody('email','Email is required').notEmpty();
  req.checkBody('email','Email is not valid').isEmail();
  req.checkBody('password','Password is required').notEmpty();
  req.checkBody('password2','Please confirm the password').notEmpty();
  req.checkBody('password2','Passwords dont match').equals(req.body.password);

  let err=req.validationErrors();
  if(err){
    res.render('register',{
      errors:err
    });
  }
  else{
    let newUser=new User({
          name:name,
          email:email,
          username:username,
          password:password
        });

        bcrypt.genSalt(10).then((salt)=>{
          bcrypt.hash(newUser.password,salt).then((hash)=>{
            newUser.password=hash;
            newUser.save().then(()=>{
              req.flash('success','You are registered now and can log in');
              res.redirect('/users/login')
            }).catch((e)=>console.log(e));
          }).catch((e)=>console.log(e));
        }).catch((e)=>console.log(e));
    }


});

router.get('/login',(req,res)=>{
  res.render('login');
});

router.get('/logout',(req,res)=>{
  req.logout();
  req.flash('success','You have successfully logged out');
  res.redirect('/users/login');
});

router.post('/login',(req,res,next)=>{
  passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req,res,next);
});

module.exports=router;
