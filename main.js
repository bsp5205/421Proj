const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");
const mysql = require('mysql');

var passport = require('passport');
var bodyParser = require('body-parser');
var localStrategy = require('passport-local').Strategy;

//var UserName = "";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

// Login authentication
app.post('/login', (req, res) => {
    let user = req.body.username;
    let pass = req.body.password;

    // Check if entries are valid
    if (user && pass) { // Checks if values are not empty
        con.query('SELECT * FROM login WHERE user = ? AND pass = ?', [user, pass], function(error, results, fields) { // Run the query
        if (error) throw error;

        // If the login exists
        if (results.length > 0){
            // Log the user in
            res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user})
        }
        else {
            res.render('login.ejs', {title: 'FUBAR | LOGIN', message: 'USER OR PASSWORD INCORRECT'});
        }
    res.send();
    })
}})

// Handle signup requests
app.post('/signup', (req, res) => {
    let user = req.body.username;
    let pass = req.body.password;
    let pass2 = req.body.verifypassword;
   
})

app.use(express.static(path.join(__dirname,'public')));


app.get("/", function(req,res){
    res.render("index", {title:"FUBAR | Home",message:"This is a message"});
});

app.get("/login", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message:""});
});

app.get("/profile", (req, res) => {
    res.render("profile.ejs", {title: "FUBAR | Login", username:""});
});

app.get("/DM", (req, res) => {
    res.render("DM.ejs", {title: "FUBAR | Login", username: UserName});
});

app.get("/login-failed", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message: "Username or password incorrect. Please try again."});
});

app.get("/signup", (req,res) =>{
    res.render("signup.ejs", {title: "FUBAR | Sign Up"})
});

app.get("/post_name", (req, res) => {
    res.render("post", {title:"FUBAR | Post Title", post_content:"Post content"});
});

app.get("/register", (req, res) => {
    res.render("register.ejs", {title: "FUBAR | Register"});
});

app.get("/subforum", (req, res) => {
    res.render("subforum.ejs", {title: "FUBAR | Subforum #1"});
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});


// Connect to the database
var con = mysql.createConnection({
    host     : 'fubar.c15l35ljlxyx.us-east-1.rds.amazonaws.com',
    port     : '3306',
    user     : 'admin',
    password : 'password',
    database : 'fubar'
});
  
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});