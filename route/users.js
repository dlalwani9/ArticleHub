const express=require('express');
const router=express.Router();
const {User}=require('../models/user');
const bcrypt=require('bcryptjs');
const passport=require('passport');
const async=require('async');
const crypto=require('crypto');
const nodemailer=require('nodemailer');

router.get('/register',(req,res)=>{
  if(req.user){
    req.flash('danger','Already registered and logged in.');
    res.redirect('/');
  }
  else{
  res.render('register');
  }
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
      User.findOne({email:req.body.email}).then((user)=>{
        if(user){
        //  console.log(user);
        req.flash('danger','Email already exists');
        res.render('register');
        }
        else{
          User.findOne({username:req.body.username}).then((user)=>{
            if(user){
            req.flash('danger','Username already exists');
            res.render('register');
            }
            else{
              let newUser=new User({
                    name:name,
                    email:email,
                    username:username,
                    password:password,
                    resetPasswordToken:undefined,
                    resetPasswordExpires:undefined
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
          }).catch((e)=>console.log(e));
        }
      }).catch((e)=>console.log(e));

  }


});

router.get('/login',(req,res)=>{
  if(req.user){
    req.flash('danger','Already logged in');
    res.redirect('/');
  }
  else{
  res.render('login');
  }
});

router.get('/logout',(req,res)=>{
  if(req.user){
  req.logout();
  req.flash('success','You have successfully logged out');
  res.redirect('/users/login');
}
else{
  req.flash('danger','Not Logged In');
  res.redirect('/');
}
});

router.post('/login',(req,res,next)=>{
  passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash: true
  })(req,res,next);
});

router.get('/forgot',(req,res)=>{
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('danger', 'No account with that email address exists.');
          return res.redirect('/users/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'articlehubreset@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'articlehubreset@gmail.com',
        subject: 'Password change for your account on articlehub.herokuapp.com',
        text:'Hi '+user.name+',\n'+
          'We got a request to reset your ArticleHub password.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('danger', 'Password reset token is invalid or has expired.');
          return res.redirect('/users/forgot');
        }
        if(req.body.password === req.body.confirm) {
          bcrypt.genSalt(10,function(err,salt){
            bcrypt.hash(req.body.password,salt,function(err,hash){
              let query={_id:user._id};
              user.password=hash;
              user.resetPasswordToken="";
              User.update(query,user,function(err){
                done(err,user);
              });
            });
          });
        }
        else {
            req.flash("danger", "Passwords do not match.");
            return res.redirect('/users/reset/'+req.params.token);
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'articlehubreset@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'articlehubreset@gmail.com',
        subject: 'Password change for your account on articlehub.herokuapp.com',
        text:'Hi '+user.name+',\n'+
          'Your password for ArticleHub account has been changed successfully.'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent for password change');
        req.flash('success', 'Your password has been changed successfully. Please log in to continue.');
        done(err, 'done');
      });
    }
  ], function(err) {
    res.redirect('/users/login');
  });
});


module.exports=router;
