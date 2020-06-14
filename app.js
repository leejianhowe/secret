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
  password: String
});

userSchema.plugin(passportLocalMongoose)

//to encryptthe password using env var created .env file


// userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});

const Account = mongoose.model("Account", userSchema)

passport.use(Account.createStrategy());

passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

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

      // var authenticate = User.authenticate();
      // authenticate('username', 'password', function(err, result) {
      //   if (err) { ... }
      //
      //   // Value 'result' is set to false. The user could not be authenticated since the user is not active
      // });
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


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
