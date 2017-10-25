const express=require('express');
const router=express.Router();
const {Article}=require('../models/article');
const {User}=require('../models/user');
var mongoose = require('mongoose');
var paginate = require('paginate')({
	mongoose: mongoose
});


router.get('/add',ensureAuthenticated,(req,res)=>{
  res.render('add',{
    title:"Add Post"
  });
});

router.get('/gallery', function(req, res, next) {
    Article.find().paginate({ page: req.query.page }, function(err, articles) {
        res.render('index', {
            articles: articles,
            title:"Posts"
        });
    });
  });

	router.post('/search', (req, res)=> {
		if(req.body.search.length==0){
			req.flash('danger','Invalid search');
			return res.redirect('/articles/gallery');
		}
	  Article.dataTables({
			limit: 30,
	    search: {
	      value: req.body.search,
	      fields: ['body','authorName','title','category']
	    },
	    sort: {
	      authorName: 1
	    }
	  }).then((table)=>{
				res.render('search',{
					articles:table.data,
					title:'Search Results'
				});
			}); // table.total, table.data
	});



router.get('/personal',(req,res)=>{
  if(req.user){
  Article.find({author:req.user._id}).paginate({ page: req.query.page }, function(err, articles) {
    if(articles.length>0){
      res.render('index', {
          articles: articles,
          title:"Your Content"
      });
    }
    else{
    req.flash('danger','Please write an article to view the page');
    res.redirect('/articles/add');
    }
  });
}
else{
  req.flash('danger','Please Log in to write articles');
  res.redirect('/');
}

});

router.get('/:id',(req,res)=>{
  Article.findById(req.params.id).then((article)=>{
		Article.findOneAndUpdate({_id:req.params.id},{$inc:{views:1}}).then(()=>{
		}).catch((e)=>console.log(e));
    User.findById(article.author).then((user)=>{
			var views=article.views;
			views++;
      res.render('article',{
        article:article,
        author:user.name,
				views:views
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
      title:'Edit Post',
      article:article
    });
  }
  }).catch((e)=>console.log(e));
});

router.post('/add',(req,res)=>{
  req.checkBody('title','Title is required').notEmpty();
  req.checkBody('category','Category is required').notEmpty();
  req.checkBody('body','Body is required').notEmpty();

  let err=req.validationErrors();
  if(err){
    res.render('add',{
      title:'Add Post',
      errors:err
    });
  }
  else{
      var time=new Date().toString();
      console.log(time);
      var article=new Article({
      title:req.body.title,
      author:req.user._id,
      body:req.body.body,
      written:time,
			authorName:req.user.name,
			category:req.body.category
    });

    article.save().then(()=>{
      req.flash('success','Post Added');
      res.redirect('/');
    }).catch((e)=>console.log(e));
  }
});

router.post('/edit/:id',(req,res)=>{
  var article={
    title:req.body.title,
    author:req.user._id,
    body:req.body.body,
		category:req.body.category,
		_id:req.params.id
  };

	req.checkBody('title','Title is required').notEmpty();
  req.checkBody('category','Category is required').notEmpty();
  req.checkBody('body','Body is required').notEmpty();

  let err=req.validationErrors();
  if(err){
		res.render('edit',{
			title:'Edit Post',
			article:article,
			errors:err
		});
  }
	else{
  let query={_id:req.params.id};
  Article.update(query,article).then(()=>{
    req.flash('success','Post Updated');
    res.redirect('/');
  }).catch((e)=>console.log(e));
}
});

router.get('/delete/:id',(req,res)=>{
  if(!req.user._id){
    res.status(500).send();
  }
  else{
  let query={_id:req.params.id};

  Article.findById(req.params.id,function(err,article){
    if(req.user.isAdmin){
      Article.remove(query).then(()=>{
        req.flash('Success','Post deleted');
				res.redirect('/articles/gallery');
      }).catch((e)=>console.log(e));
    }
    else{
      if(article.author!=req.user._id){
        res.status(500).send();
      }
      else{
        Article.remove(query).then(()=>{
					req.flash('Success','Post deleted');
					res.redirect('/articles/gallery');
        }).catch((e)=>console.log(e));
      }
    }

  });
}
});

module.exports=router;
