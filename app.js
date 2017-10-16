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

app.get('/articles/add',(req,res)=>{
  res.render('add',{
    title:"Add Article"
  });
});

app.get('/article/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    res.render('article',{
      article:article
    });
  }).catch((e)=>console.log(e));
});

app.get('/article/edit/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    res.render('edit',{
      title:'Edit Article',
      article:article
    });
  }).catch((e)=>console.log(e));
});

app.post('/articles/add',(req,res)=>{
  req.checkBody('title','Title is required').notEmpty();
  req.checkBody('author','Author is required').notEmpty();
  req.checkBody('body','Body is required').notEmpty();

  let err=req.validationErrors();
  if(err){
    res.render('add',{
      title:'Add Article',
      errors:err
    });
  }
  else{
      var article=new Article({
      title:req.body.title,
      author:req.body.author,
      body:req.body.body
    });

    article.save().then(()=>{
      req.flash('success','Article Added');
      res.redirect('/');
    }).catch((e)=>console.log(e));
  }
});

app.post('/articles/edit/:id',(req,res)=>{
  var article={
    title:req.body.title,
    author:req.body.author,
    body:req.body.body
  };

  let query={_id:req.params.id};
  Article.update(query,article).then(()=>{
    req.flash('success','Article Updated');
    res.redirect('/');
  }).catch((e)=>console.log(e));
});

app.delete('/articles/:id',(req,res)=>{
  let query={_id:req.params.id};
  Article.remove(query).then(()=>{
    res.send('Success');
  }).catch((e)=>console.log(e));
});

app.listen(3000,()=>{
  console.log('Started on port 3000');
});
