const express=require('express');
const path=require('path');
const {mongoose}=require('./db/mongoose');
const {Article}=require('./models/article');
var bodyParser=require('body-parser');
var expressValidator=require('express-validator');
var flash=require('connect-flash');
var session=require('express-session');

var app=express();
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

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');

app.get('/',(req,res)=>{
  Article.find({}).then((articles)=>{
    res.render('index',{
      title:"Articles",
      articles:articles
    })
  }).catch((e)=>console.log(e));
});

var articles=require('./route/articles');
app.use('/articles',articles);


app.listen(3000,()=>{
  console.log('Started on port 3000');
});
