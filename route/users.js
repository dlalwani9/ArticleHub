const express=require('express');
const router=express.Router();
const {User}=require('../models/user');
const {Confirm}=require('../models/confirm');
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
        if(req.body.password.length<6){
          req.flash('danger','Password must be of at least 6 characters')
          res.redirect('/users/register');
          return;
        }
        User.findOne({username:req.body.username}).then((user)=>{
          if(user){
          req.flash('danger','Username already exists');
          res.render('register');
          }
          else{
            User.findOne({email:req.body.email}).then((user)=>{

              if(user && user.facebookId){

                bcrypt.genSalt(10, function(err, salt){
                  bcrypt.hash(password, salt, function(err, hash){
                    if(err){
                      console.log(err);
                      return;
                    }
                    User.findOneAndUpdate({email:req.body.email},
                      {$set:{name:name,username:username,password:hash}},function(err){
                      if(err){
                        console.log(err);
                        return;
                      } else {
                        req.flash('success','You are now registered and can log in');
                        res.redirect('/users/login');
                      }
                    });
                  });
                });



              }
            else if(user){
              req.flash('danger','Email already exists');
              res.render('register');
            }
            else{
            let newUser=new Confirm({
                  name:name,
                  email:email,
                  username:username,
                  password:password,
                  verified:false
                });

                crypto.randomBytes(20,function(err,buf){
                  if(err){
                    console.log(err);
                  }
                  else{
                    var token = buf.toString('hex');
                    bcrypt.genSalt(10).then((salt)=>{
                      bcrypt.hash(newUser.password,salt).then((hash)=>{
                        newUser.password=hash;
                        newUser.verifyToken=token;
                        newUser.verifyTokenExpires = Date.now() + 86400000;

                          var smtpTransport = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                              user: 'articlehubreset@gmail.com',
                              pass: process.env.GMAILPW
                            }
                          });
                          var mailOptions = {
                            to: email,
                            from: 'articlehubreset@gmail.com',
                            subject: 'Account verification for your account on articlehub.herokuapp.com',
                            text:'Hi '+name+',\n\n'+
                              'Please click on the following link, or paste this into your browser to complete the Registeration process:\n\n' +
                              'http://' + req.headers.host + '/users/verify/' + token+'\n\n'+
                              'This link is valid for 24 hours.'
                          };

                            newUser.save().then(()=>{
                              smtpTransport.sendMail(mailOptions).then(()=>{
                                console.log('mail sent');
                                req.flash('success','An email has been sent to '+email+
                                ' with further instructions to verify your account.');
                                res.redirect('/');

                              },(err)=>{
                                req.flash('danger','Some error occured while processing your request.');
                                res.redirect('/');
                              });

                            }).catch((e)=>{
                              req.flash('danger','An Email to email id: '+email+' was already sent for verification.');
                              res.redirect('/');
                            });



                      }).catch((e)=>console.log(e));
                    }).catch((e)=>console.log(e));


                  }
                });

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

router.get('/clear',(req,res)=>{
  if(req.user && req.user.isAdmin){
  Confirm.remove({verifyTokenExpires: { $gt: Date.now() } }).then(()=>{
    req.flash('success','Success');
    res.redirect('/');
  }).catch((e)=>console.log(e));
}
else {
  req.flash('danger','Not Authorized');
  res.redirect('/');
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
        if(user && user.facebookId && !user.username){
          req.flash('danger', 'You have not created an ArticleHub account. '+
          'You Logged in through Facebook Earlier. Please log in through Facebook to continue'+
          ' or Please Register in order to create an ArticleHub account.');
          return res.redirect('/users/register');
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

router.get('/verify/:token', function(req, res) {
  Confirm.findOne({ verifyToken: req.params.token, verifyTokenExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){
      req.flash('error', 'Some Error Occured, Inconvenience is regretted.');
      return res.redirect('/');
    }

    if (!user) {
      req.flash('error', 'Account verification token is invalid or has expired.');
      return res.redirect('/users/register');
    }
    var newUser=new User({
      name:user.name,
      email:user.email,
      username:user.username,
      password:user.password,
      verified:true
    })
    let query={verifyToken: req.params.token};

    Confirm.findOneAndRemove(query).then(()=>{
    newUser.save().then(()=>{
      req.flash('success', 'Your account has been verified. Now you can log in');
      res.redirect('/users/login');
    }).catch((e)=>{
      req.flash('error', 'Some Error Occured, Inconvenience is regretted.');
      res.redirect('/');
    });

    }).catch((e)=>{
      req.flash('error', 'Some Error Occured, Inconvenience is regretted.');
      res.redirect('/');
    });

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
