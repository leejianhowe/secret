//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

console.log(process.env.SECRET);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
//add mongoose.schema to use mongoose-encryption
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
//to encryptthe password


userSchema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});

const Account = mongoose.model("Account", userSchema)

app.route('/')
  .get(function(req, res) {
  res.render("home")
})

app.route('/login')
  .get(function(req, res) {
  res.render("login")
})
  .post(function(req,res){
  const username = req.body.username
  const password = req.body.password
    Account.findOne({username: username},function(err,foundAccount){
      if(!err){
        if(foundAccount){
        if(foundAccount.password === password){
        res.render("secrets")
        }}
      }else{
        res.send("err")
        }
      })
    })

app.route('/register')
  .get(function(req, res) {
  res.render("register")
})
.post(function(req,res){
  const newAccount = new Account({
    username: req.body.username,
    password: req.body.password
  })
  newAccount.save(function(err){
    if(!err){
      res.render("secrets")
    }else{
      res.send("error")
      console.log(err)
    }
  })
})


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
