const express=require('express');
const path=require('path');
const {mongoose}=require('./db/mongoose');
const {Article}=require('./models/article');
const {User}=require('./models/user');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
var flash=require('connect-flash');
const passport=require('passport');
var session=require('express-session');
var FacebookStrategy = require('passport-facebook').Strategy;

var app=express();
const port=process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

require('./config/passport')(passport);
// console.log(profile.name.givenName+' '+profile.name.familyName);
// console.log(profile.emails[0].value);

passport.use(new FacebookStrategy({
	    clientID: process.env.CLIENTID,
	    clientSecret: process.env.CLIENTSECRET,
	    callbackURL: 'https://articlehub.herokuapp.com/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name']
	  },
	  function(accessToken, refreshToken, profile, done) {
      User.findOne({ facebookId: profile.id }).then((user)=>{
        if(user){
        return done(null,user);
        }
        if(!user){

          User.findOne({ email:profile.emails[0].value }).then((user)=>{
            if(user){
            User.findOneAndUpdate({ email:profile.emails[0].value },
              {$set:{facebookId:profile.id}}).then(()=>{
                console.log('facebook profileid updated in local account');
              }).catch((e)=>console.log(e));
              return done(null,user);
              }
            if(!user){

              var NAME=profile.name.givenName+' '+profile.name.familyName;
              let newUser=new User({
                    name:NAME,
                    email:profile.emails[0].value,
                    facebookId:profile.id
                  });
              newUser.save().then(()=>{
                return done(null,newUser);
              }).catch((e)=>{throw e});

            }
          })

        }
      }).catch((e)=>console.log(e));
	    }
	));



app.use(passport.initialize());
app.use(passport.session());


app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

app.get('*',(req,res,next)=>{
  res.locals.user=req.user||null;
  next();
});

app.get('/',(req,res)=>{
  res.render('home');
});

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback',
	  passport.authenticate('facebook', { successRedirect: '/',
	                                      failureRedirect: '/users/login' }));


var articles=require('./route/articles');
var users=require('./route/users');
app.use('/articles',articles);
app.use('/users',users);

app.listen(port,()=>{
  console.log(`Started server on port ${port}`);
});
