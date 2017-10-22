const LocalStrategy=require('passport-local').Strategy;
const {User}=require('../models/user');
const bcrypt=require('bcryptjs');

module.exports=function(passport){
  passport.use(new LocalStrategy(function(username,password,done){
    let query={username:username};
    User.findOne(query).then((user)=>{
      if(!user){
        return done(null,false,{message:'No User Found'});
      }

      
      bcrypt.compare(password,user.password).then((isMatch)=>{
        if(isMatch){
          return done(null,user);
        }
        else{
          return done(null,false,{message:'Wrong Password'});
        }
      }).catch((e)=>{throw e});

    }).catch((e)=>{throw e});
  }));

  passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

}
