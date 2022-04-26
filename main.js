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

var multer  = require('multer');

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

//set default dir
app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

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
                        con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test, fields) {
                            if (results.length > 0) {
                                session = req.session;
                                session.userid = user;
                                con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getForums, fields) {
                                    con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getFollowed, fields) {
                                        res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test, forums: getForums, followed: getFollowed});
                                        console.log('Login Success')
                                    })
                                })
                            } else {
                                res.render('login.ejs', {
                                    title: 'FUBAR | LOGIN',
                                    message: 'USER OR PASSWORD INCORRECT'
                                });
                            }
                            console.log('Login Success')
                        })
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
        con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test3, fields) {
            con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getForums, fields) {
                con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getFollowed, fields) {
                    res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test3, forums: getForums, followed: getFollowed});
                    console.log('Login Success')
                })
            })
        })
    }else{
        res.render("login.ejs", {title: "FUBA`R | Login", message:""});
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
        res.render("post", {title:"FUBAR | Post Title", post_content:"Post content", username: user, path: myPath});
    }else{
        res.render("login.ejs", {title: "FUBAR | Login", message:""});
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs", {title: "FUBAR | Register"});
});

app.get("/subforum", (req, res) => {
    con.query('SELECT * FROM subforums WHERE title = ?', ['FUBAR'], function(error, subforum, fields) {
        con.query('SELECT * FROM posts WHERE subforumID = ?', [subforum[0]['id']], function(error, posts, fields) {
            res.render("subforum.ejs", {title: "FUBAR | " + subforum[0]['title'], username: user, data: subforum, post: posts});
        })
    })
});

app.get("/createPost", (req, res)=>{
    con.query('SELECT * FROM subforums WHERE title = ?', ['FUBAR'], function(error, subforum, fields) {
        res.render("createpost.ejs", {title: "FUBAR | " + subforum[0]['title'], username: user, data: subforum});
    })
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

app.post('/update', (req, res) =>{
    console.log("Updating DB");
    let newName = req.body.nameUpdate;
    let newPhone = req.body.phoneUpdate;
    let newCountry = req.body.countryUpdate;
    let newBio = req.body.bioUpdate;
    //update DB
    con.query( "UPDATE Profile_Info SET name = ?, phone = ?, country = ?, bio = ? WHERE user = ?",[newName, newPhone, newCountry, newBio, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
    //refresh profile page to show updated info

    con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test3, fields) {
        con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getForums, fields) {
            con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, getFollowed, fields) {
                res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test3, forums: getForums, followed: getFollowed});
                console.log('Login Success')
            })
        })
    })

});

app.post('/updateGitHub', (req, res) =>{
    console.log("Updating GitHub");
    let newGitHub = req.body.GHEdit;
    con.query( "UPDATE Profile_Info SET github = ? WHERE user = ?",[newGitHub, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

app.post('/updateTwitter', (req, res) =>{
    console.log("Updating Twitter");
    let newTwitter = req.body.TwitterEdit;
    con.query( "UPDATE Profile_Info SET twitter = ? WHERE user = ?",[newTwitter, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

app.post('/updateInsta', (req, res) =>{
    console.log("Updating Instagram");
    let newGitHub = req.body.InstaEdit;
    con.query( "UPDATE Profile_Info SET insta = ? WHERE user = ?",[newGitHub, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

app.post('/updateFacebook', (req, res) =>{
    console.log("Updating Facebook");
    let newFacebook = req.body.FBEdit;
    console.log(newFacebook);
    con.query( "UPDATE Profile_Info SET facebook = ? WHERE user = ?",[newFacebook, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

app.use('/public/images', express.static('public/images'));

var upload = multer({ storage: storage })
app.get("/", (req, res) => {
    res.render("index.ejs", {title: "FUBAR | Login"});
});

var profPicPath;
app.post('/profile-upload-single', upload.single('profile-file'), function (req, res, next) {
    // req.file is the `profile-file` file
    // req.body will hold the text fields, if there were any
    console.log(JSON.stringify(req.file))
    var response = '<a href="/">Home</a><br>'
    response += "Files uploaded successfully.<br>"
    response += `<img src="${req.file.path}" /><br>`
    profPicPath = req.file.path;
    profPicPath = profPicPath.replace('public\\','');
    profPicPath = profPicPath.replace('\\','/');
    profPicPath = './' + profPicPath
    console.log(profPicPath)
    console.log("Updating DB profile picture");
    con.query( "UPDATE Profile_Info SET profilePicLink = ? WHERE user = ?",[profPicPath, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });

    //return res.send(response)
})

