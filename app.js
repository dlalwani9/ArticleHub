const express=require('express');
const path=require('path');
const {mongoose}=require('./db/mongoose');
const {Article}=require('./models/article');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
var flash=require('connect-flash');
const passport=require('passport');
var session=require('express-session');

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

var articles=require('./route/articles');
var users=require('./route/users');
app.use('/articles',articles);
app.use('/users',users);


app.listen(port,()=>{
  console.log(`Started server on port ${port}`);
});
