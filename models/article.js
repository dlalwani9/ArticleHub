const mongoose=require('mongoose');

let articleSchema=mongoose.Schema({
    title:{
      type:String,
      required:true
    },
    author:{
      type:String,
      required:true
    },
    body:{
      type:String,
      required:true
    }
});

var Article=mongoose.model('Article',articleSchema);
module.exports={Article};
