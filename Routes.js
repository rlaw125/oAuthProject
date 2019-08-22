const passport = require('passport');
const LocalStrategy = require('passport-local');
const express = require('express');

const bcrypt = require('bcrypt');
const GitHubStrategy = require('passport-github').Strategy;


module.exports = (app, db)=>{
  
  let ensureAuthenticated = (req, res, next)=>{
  console.log("Ensure Authenticated Request: "+req);
if (req.isAuthenticated()){
return next();
}
  res.redirect('/');
}
  
  app.route('/').get((req, res) => {
    res.render(process.cwd()+'/views/pug/index.pug', {title:'Hello', message: 'Please login', showLogin: true, showRegistration: true});
  });

app.post('/login', passport.authenticate('local', {failureRedirect:'/', successRedirect: '/profile'})); 

app.route('/profile').get(ensureAuthenticated, (req, res)=>{  
  
res.render(process.cwd()+'/views/pug/profile.pug', {username: req.user.username});
});

app.route('/logout').get((req, res)=>{
req.logout();
res.redirect('/');
});

app.route('/register')
  .post((req, res, next) => {
let hash = bcrypt.hashSync(req.body.password, 12);
db.collection('users').findOne({ username: req.body.username }, function (err, user) {
        if(err) {
            next(err);
        } else if (user) {
           console.log('user: '+user + " "+ req.path);
            res.redirect('/');
        } else {
          console.log('user not in system' + req.path);
            db.collection('users').insertOne(
              {username: req.body.username,
               password: hash},
              (err, doc) => {
                  if(err) {
                      res.redirect('/');
                  } else {
                      next(null, user);
                  }
              });
        }
    });
  
    
}, passport.authenticate('local', { failureRedirect: '/', successRedirect:'/profile'}));
  
  
  
app.route('/auth/github')
  .get(passport.authenticate('github'));
  
  
app.route('/auth/github/callback')
      .get(passport.authenticate('github', {failureRedirect: '/'}),(req,res)=>{
 // console.log('Request successful from /auth/github/callback: '+ req.body);
  console.log("User was", JSON.stringify(req.user));
res.redirect('/profile');
});
  
  

app.use((req, res, next)=>{
res.status(404).type('text').send('Not found');
});


}