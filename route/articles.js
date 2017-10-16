const express=require('express');
const router=express.Router();
const {Article}=require('../models/article');

router.get('/add',(req,res)=>{
  res.render('add',{
    title:"Add Article"
  });
});

router.get('/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    res.render('article',{
      article:article
    });
  }).catch((e)=>console.log(e));
});

router.get('/edit/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
    res.render('edit',{
      title:'Edit Article',
      article:article
    });
  }).catch((e)=>console.log(e));
});

router.post('/add',(req,res)=>{
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

router.post('/edit/:id',(req,res)=>{
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

router.delete('/:id',(req,res)=>{
  let query={_id:req.params.id};
  Article.remove(query).then(()=>{
    res.send('Success');
  }).catch((e)=>console.log(e));
});

module.exports=router;
