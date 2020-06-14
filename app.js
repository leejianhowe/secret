//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); //replaced with md5 encrytioon
// const md5 = require("md5");//using bcrypt
// const bcrypt = require('bcrypt');
// const saltRounds = 10;// switch to using passport js
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const findOrCreate = require('mongoose-findorcreate')


const app = express();

// console.log(process.env.SECRET); //using encrypt

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//add mongoose.schema to use mongoose-encryption
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate);

//to encryptthe password using env var created .env file


// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});

const Account = mongoose.model("Account", userSchema)

passport.use(Account.createStrategy());

//not in use only for passport-local-mongoose
// passport.serializeUser(Account.serializeUser());
// passport.deserializeUser(Account.deserializeUser());

//serialize account info using passport
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

//deserialize account info using passport
passport.deserializeUser(function(id, done) {
  Account.findById(id, function(err, user) {
    done(err, user);
  });
});
//using facebook oauth2.0
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
    Account.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//using google oauth2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    Account.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));



app.route('/')
  .get(function(req, res) {
    res.render("home")
  })

app.route('/login')
  .get(function(req, res) {
    res.render("login")
  })
  .post(function(req, res) {
    const user = new Account({
      username: req.body.username,
      password: req.body.password
    })

    req.login(user, function(err) {
      if (err) {
        console.log(err)
      } else {
        passport.authenticate('local')(req, res, function() {
          res.redirect('/secrets')
        })
      }
    })
  })

app.route('/register')
  .get(function(req, res) {
    res.render("register")
  })
  .post(function(req, res) {
    Account.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err)
        res.redirect('/register')
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect('/secrets')
        })
      }
    });
  })
app.route('/secrets')
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      res.render("secrets")
    } else {
      res.redirect('login')
    }
  })

app.route('/logout')
  .get(function(req, res) {
    req.logout()
    res.redirect('/')
  })

//auth with google
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));
app.get('/auth/google/secret',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect to secret.
    res.redirect('/secrets');
  });

//auth with facebook
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secret',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
