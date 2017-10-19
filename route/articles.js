const express=require('express');
const router=express.Router();
const {Article}=require('../models/article');
const {User}=require('../models/user');

router.get('/add',ensureAuthenticated,(req,res)=>{
  res.render('add',{
    title:"Add Article"
  });
});

router.get('/gallery',(req,res)=>{
  Article.find({}).then((articles)=>{
    res.render('index',{
      title:"Articles",
      articles:articles
    })
  }).catch((e)=>console.log(e));
});

router.get('/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    User.findById(article.author).then((user)=>{
      res.render('article',{
        article:article,
        author:user.name
      });
    }).catch((e)=>console.log(e));
  }).catch((e)=>console.log(e));
});

function ensureAuthenticated(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    req.flash('danger','Please Login');
    res.redirect('/users/login');
  }
};

router.get('/edit/:id',ensureAuthenticated,(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    if(article.author!=req.user._id){
      req.flash('danger','Not Authorized');
      res.redirect('/');
    }
    else {
    res.render('edit',{
      title:'Edit Article',
      article:article
    });
  }
  }).catch((e)=>console.log(e));
});

router.post('/add',(req,res)=>{
  req.checkBody('title','Title is required').notEmpty();
  //req.checkBody('author','Author is required').notEmpty();
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
      author:req.user._id,
      body:req.body.body
    });

    article.save().then(()=>{
      req.flash('success','Article Added');
      res.redirect('/');
    }).catch((e)=>console.log(e));
  }
});

router.post('/edit/:id',(req,res)=>{
  var article={
    title:req.body.title,
    author:req.user._id,
    body:req.body.body
  };

  let query={_id:req.params.id};
  Article.update(query,article).then(()=>{
    req.flash('success','Article Updated');
    res.redirect('/');
  }).catch((e)=>console.log(e));
});

router.delete('/:id',(req,res)=>{
  if(!req.user._id){
    res.status(500).send();
  }
  else{
  let query={_id:req.params.id};

  Article.findById(req.params.id,function(err,article){
    if(req.user._id=="59e4d03d2a00111b28423e46" || req.user._id=="59e5cc19f38fe700125d9e4e"){
      Article.remove(query).then(()=>{
        res.send('Success');
      }).catch((e)=>console.log(e));
    }
    else{
      if(article.author!=req.user._id){
        res.status(500).send();
      }
      else{
        Article.remove(query).then(()=>{
          res.send('Success');
        }).catch((e)=>console.log(e));
      }
    }

  });
}
});

module.exports=router;
