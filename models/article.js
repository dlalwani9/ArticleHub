const mongoose=require('mongoose');
var dataTables = require('mongoose-datatables');

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
    },
    written:String,
    views:{
      type:Number,
      default:1
    },
    authorName:String,
    category:{
      type:String,
      required:true
    }
});

articleSchema.plugin(dataTables);

var Article=mongoose.model('Article',articleSchema);
module.exports={Article};
