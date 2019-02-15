'use strict';
const routes = require('./Routes.js');
const auth = require('./Auth.js');
const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const app = express();
const session = require('express-session');
const pug = require('pug');
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy; 



fccTesting(app); //For FCC testing purposes


mongo.connect(process.env.DATABASE, (err, db)=>{
  if (err){
  console.log("connection error: "+ err);
  return;
  }
  auth(app, db);
  routes(app, db);   
});



if (process.env.ENABLE_DELAYS){
app.use((req, res, next)=>{
switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/logout': return setTimeout(() => next(), 500);
        case '/profile': return setTimeout(() => next(), 700);
        default: next();
      }
    break;
    case 'POST':
      switch (req.url) {
        case '/login': return setTimeout(() => next(), 900);
        default: next();
      }
    break;
    default: next();
  }
});
}
 
app.set('view engine', 'pug')
app.use('/public', express.static(process.cwd() + '/public'));
app.use(session({
secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
 

/*
app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
}); */