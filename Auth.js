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
  console.log("Successfully serialized :" + JSON.stringify(user)); 
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
      console.log(id);
    userCollection = "socialusers";
    }
 db.collection(userCollection).findOne({_id: new ObjectID(id)}, (err,doc)=>{
   if (err){console.log("New objectID not found!");return done(err)}
   console.log("Deserialization success!")
  done(null, doc);
 }); 
}); 
   
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://easy-sturgeon.glitch.me/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("in passportGithub: " + process.env.GITHUB_CLIENT_ID);
   
 db.collection('socialusers').findAndModify(
    {id: profile.id},
    {},
    {$setOnInsert:{
        id: profile.id,
        name: profile.displayName || 'John Doe',
        photo: profile.photos[0].value || '',
       // email: profile.emails[0].value || 'No public email',
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
       console.log('Profile saved or modified: '+ JSON.stringify(profile));
        return cb(null, doc.value);
    }
);
    /*
    db.collection('users').findOne({ githubId: profile.id }, function (err, user) {
      console.log("github profileId created");
      if (err){
      console.log("Database error in passport Github: " +err);
      return cb(err, null);
      } else if (user!==null){
      console.log("github profile exists");
      return cb(null, user);
      } else {
      
        
      db.collection('users').insertOne({githubId: profile.id}, function(err, user){
      if (err){
        console.log("Error saving github profile");
      return cb(err, null);
        console.log("Success saving github profile id.")
      }
        return cb(null, accessToken);
      }); 
        
      }
    });  */
    
    
  }
));

    
  passport.use(new LocalStrategy((username, password,done)=>{
    console.log('passport-local: '+username);
  db.collection('users').findOne({username:username}, (err, user)=>{
  console.log('User: '+username+' attempted to login');
  if (err){ return done(err)};
  if (!user){ console.log("No such user!"); return done(null, false);  };
  if (!bcrypt.compareSync(password, user.password)){ console.log("Password incorrect."); return done(null, false);};
  return done(null, user);
    
  });
  }));
    
  



}