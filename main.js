const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");
const mysql = require('mysql');


const app = express();
const port = 3000;

app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

app.use(express.static(path.join(__dirname,'public')));

app.get("/", function(req,res){
    res.render("index", {title:"FUABAR | Home",message:"This is a message"});
});

app.get("/login", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login"});
});

app.get("/register", (req, res) => {
    res.render("register.ejs", {title: "FUBAR | Register"});
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});


// Connect to the database

var con = mysql.createConnection({
    host     : 'fubar.c15l35ljlxyx.us-east-1.rds.amazonaws.com',
    user     : 'admin',
    password : 'password'
});
  
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});