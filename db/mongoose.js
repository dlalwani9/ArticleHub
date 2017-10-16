var mongoose=require('mongoose');

mongoose.Promise=global.Promise; //in order to tell mongoose that we are using promises
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/nodekb",{useMongoClient:true});

module.exports={mongoose};
