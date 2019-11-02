const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const express = require('express');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = (app, db)=>{
  
  app.listen(process.env.PORT, ()=>{
  passport.serializeUser((user, done)=>{
    if (user.provider){
       done(null, "github:"+user._id); 
        }
    else {
      done(null, user._id);
    }
  });
  });
    
  passport.deserializeUser((id, done)=>{
     let reggles = /github\:/;
    let userCollection = "users";
    if (reggles.test(id)){
      id = id.slice(7);
    userCollection = "socialusers";
    }
 db.collection(userCollection).findOne({_id: new ObjectID(id)}, (err,doc)=>{
   if (err){console.log("New objectID not found!");return done(err)}
  done(null, doc);
 }); 
}); 
   
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://easy-sturgeon.glitch.me/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
 db.collection('socialusers').findAndModify(
    {id: profile.id},
    {},
    {$setOnInsert:{
        username:profile.displayName,
        id: profile.id,
        name: profile.displayName || 'Anonymous',
        photo: profile.photos[0].value || '',
        created_on: new Date(),
        provider: profile.provider || ''
    },$set:{
        last_login: new Date()
    },$inc:{
        login_count: 1
    }},
    {upsert:true, new: true},
    (err, doc) => {
      if (err){
      return cb(err, null);
      } 
        return cb(null, doc.value);
    }
);
    
  }
));

  
  passport.use(new LocalStrategy((username, password,done)=>{
  db.collection('users').findOne({username:username}, (err, user)=>{
  if (err){ return done(err)};
  if (!user){ console.log("No such user!"); return done(null, false);  };
  if (!bcrypt.compareSync(password, user.password)){ console.log("Password incorrect."); return done(null, false);};
  return done(null, user);
    
  });
  }));
    
}