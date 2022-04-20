const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");
const mysql = require('mysql');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const bcrypt = require('bcrypt')

var passport = require('passport');
var bodyParser = require('body-parser');
const { title } = require('process');
var localStrategy = require('passport-local').Strategy;

const app = express();
const port = 3000;

var session;

app.use(sessions({
    secret: "thisisasecretstring",
    saveUninitialized: true,
    cookie: {maxAge : 1000000},
    resave: false
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
app.use(cookieParser());

app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

//user class
class userProfile{
    constructor(accountUsername, accountEmail, accountPhone, accountAddress, accountBio, accountGitHub, accountTwitter, accountInsta, accountFB, accountLink, favoriteForums, followedUsers) {
        this.accountUsername = accountUsername;
        this.accountEmail = accountEmail;
        this.accountPhone = accountPhone;
        this.accountAddress = accountAddress;
        this.accountBio = accountBio;
        this.accountGitHub = accountGitHub;
        this.accountTwitter = accountTwitter;
        this.accountInsta = accountInsta;
        this.accountFB = accountFB;
        this.accountLink = accountLink;
        this.favoriteForums = favoriteForums;
        this.followedUsers = followedUsers;
    }

}

var test = new userProfile("First Last", "testEmail", "123-456-7890", "test street", "This is a test bio", "test github", "test twitter", "test insta", "test FB", "Test link", "fav forums", "followed users");
test = JSON.stringify(test);
//sessionStorage.setItem("tempUser", test);

// Login authentication
var user;
app.post('/login', (req, res) => {
    user = req.body.username;
    let pass = req.body.password;

    // Check if entries are valid
    if (user && pass) { // Checks if values are not empty
        con.query('SELECT * FROM login WHERE user = ?', [user], function(error, results, fields) {
            if (error) throw error
            if (results.length > 0) {
                // Decrypt the password
                bcrypt.compare(pass, results[0].pass, function(error, result) {
                    if (error) throw error
                    console.log(pass)
                    console.log(results[0].pass)
                    console.log(result)
                    if (result) { // If compare is successful
                    // con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test, fields){
                         if (results.length > 0){
                             session = req.session;
                             session.userid = user;
                             res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test});
                         }
                         else {
                             res.render('login.ejs', {title: 'FUBAR | LOGIN', message: 'USER OR PASSWORD INCORRECT'});
                         }
                        console.log('Login Success')
                    }
                    else { // Password invalid
                        res.render('login.ejs', {title: 'FUBAR | Login', message: 'Incorrect password'})
                    }
                })
            }
            else { // Username not found
                res.render('login.ejs', {title: 'FUBAR | Login', message: 'Username does not exist'})
            }
        })
    }
}) 

// Handle signup requests
app.post('/signup', (req, res) => {
    let email = req.body.email;
    let user = req.body.username;
    let pass = req.body.password;
    let pass2 = req.body.verifypassword;
   
    // Check if fields are not empty
    if (email && user && pass && pass2){
        // Check if passwords are the same
        if (pass == pass2){
            // Check if the email or username already exists
            con.query("SELECT email, user FROM login WHERE email = ? OR user = ?", [email, user], function(error, results){
                if (error) throw error;

                if (results.length > 0) {
                    res.render('signup.ejs', {title: 'FUBAR | Signup', message: 'Email or username already exists!'})
                }
                else { // Email and username do not exist so we can create their account
                    // First setup their profile in the database

                    // Now create their login in the database after we enccrypt their password
                    bcrypt.hash(pass, 10, function(err, hash) {
                        if (err) throw err
                        con.query('INSERT INTO login (email, user, pass) VALUES (?,?,?)', [email, user, hash])
                        
                    });


                    //res.render('profile.ejs', {title: "FUBAR | ${user}", username: user})
                }
            
                res.send()
            })
    }
}})

app.use(express.static(path.join(__dirname,'public')));


app.get("/", function(req,res){
    session=req.session;
    if(session.userid){
        res.render("index", {title:"FUBAR | Home", message:"This is a message", username: user});
    }else{
        res.render("index", {title:"FUBAR | Home", message:"This is a message", username: user});
    }
});

app.get("/login", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message:""});
});

app.get("/profile", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render("profile.ejs", {title: "FUBAR | " + user, username: user});
    }else{
        res.render("login.ejs", {title: "FUBAR | Login", message:""});
    }
});

var myPath;
app.get("/DM", (req, res) => {
    myPath = "./images/Default.png";
    session=req.session;
    if(session.userid){
        res.render("DM.ejs", {title: "FUBAR | Login", username: user, path: myPath, username: user});
    }else{
        res.render("login.ejs", {title: "FUBAR | Login", message:""});
    }
});

app.get("/login-failed", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message: "Username or password incorrect. Please try again."});
});

app.get("/signup", (req,res) =>{
    res.render("signup.ejs", {title: "FUBAR | Sign Up", message: ''})
});

app.get("/post_name", (req, res) => {
    session=req.session;
    if(session.userid){
        res.render("post", {title:"FUBAR | Post Title", post_content:"Post content", username: user});
    }else{
        res.render("login.ejs", {title: "FUBAR | Login", message:""});
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs", {title: "FUBAR | Register"});
});

app.get("/subforum", (req, res) => {
    res.render("subforum.ejs", {title: "FUBAR | Subforum #1", post_content:"Subforum #1", username: user});
});

app.get("/logout",(req,res) => {
    session = req.session;
    if(session.userid) {
        req.session.destroy();
        res.redirect('/');
        user = "";
    }else{
    }
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