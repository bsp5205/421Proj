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
                    if (result) { // If compare is successful
                        con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test, fields) {
                            if (results.length > 0) {
                                session = req.session;
                                session.userid = user;
                                con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                                    con.query('SELECT * FROM followed_users WHERE user = ?', [user], function(error, getFollowed, fields) {
                                        res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test, forums: getForums, followed: getFollowed});
                                    })
                                })
                            } else {
                                res.render('login.ejs', {
                                    title: 'FUBAR | LOGIN',
                                    message: 'USER OR PASSWORD INCORRECT'
                                });
                            }
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
                        con.query("INSERT INTO Profile_Info (user, name, email, phone, country, profilePicLink, bio) VALUES (? , 'Name', ?, 'No phone number', 'country', './images/Default.png', 'User has no bio yet.')", [user, email])
                        con.query("INSERT INTO followed_forums (user, forumCount) VALUES (?, ?)",[user, 0])
                        con.query("INSERT INTO followed_users (user, userCount) VALUES (?, ?)",[user, 0])
                    });

                    // Direct them to login
                    res.render('login.ejs', {title: 'FUBAR | Login', message: ''})
                    
                }
            })
    }
}})

app.use(express.static(path.join(__dirname,'public')));

app.get("/", function(req,res){
    session=req.session;
    con.query('SELECT * FROM posts', function(error, posts, fields){
        con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getFollowedForums, fields) {
            con.query('SELECT * FROM posts ORDER BY hits LIMIT 5', function(error, trending) {
                res.render("index", {title:"FUBAR | Home", message:"This is a message", username: user, post: posts, followedForums: getFollowedForums, trending: trending});
            })
        })
    })
});

app.get("/login", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message:""});
});

app.get("/profile", (req, res) => {
    session=req.session;
    if(session.userid){
        con.query('SELECT * FROM Profile_Info WHERE user = ?', [user], function(error, test3, fields) {
            con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                con.query('SELECT * FROM followed_users WHERE user = ?', [user], function(error, getFollowed, fields) {
                    res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test3, forums: getForums, followed: getFollowed});
                })
            })
        })
    }else{
        res.render("login.ejs", {title: "FUBAAR | Login", message:""});
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

app.get("/post-:id", (req, res) => {
    session=req.session;
    var pid = req.body.postId;
    console.log("post ID = " + pid);
    var subID = req.params.id;
    if(session.userid){
        con.query('SELECT * from posts WHERE id = ?', [subID], function(error, posts, fields){
            var x = posts[0]['id'];
            console.log("postId " +  x);
            con.query('SELECT * FROM posts WHERE id = ?',[x], function(err, getPost) {
                console.log("getPOST: " + getPost);
                con.query('SELECT * FROM Comments WHERE Postid = ?',[x], function(err, Comments){
                    console.log("comment user: " + Comments[0]['user'])
                    con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                        res.render('post.ejs', {username: user, title: 'post', post: getPost, Comments: Comments, followedForums:getForums});
                    })

                    con.query('UPDATE posts SET hits = hits + 1 WHERE id = ?', [subID])
                });
            }); //               var x = posts[0]['id'];
                //console.log(x);

        })

    }else{
        res.render("login.ejs", {title: "FUBAR | Login", message:""});
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs", {title: "FUBAR | Register"});
});

app.get("/subforum-:title", (req, res) => {
    var subID = req.params.title;
    con.query('SELECT * FROM subforums WHERE title = ?', [subID], function(error, subforum, fields) {
        con.query('SELECT * FROM posts WHERE subforumID = ?', [subforum[0]['id']], function(error, posts, fields) {
            con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                res.render("subforum.ejs", {title: "FUBAR | " + subforum[0]['title'], username: user, data: subforum, post: posts, followedForums:getForums});
            })
        })
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
        con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
            con.query('SELECT * FROM followed_users WHERE user = ?', [user], function(error, getFollowed, fields) {
                res.render('profile.ejs', {title: 'FUBAR | ' + user, username: user, data: test3, forums: getForums, followed: getFollowed});
            })
        })
    })

});

app.post('/createpost-:id', (req,res)=>{
    console.log("making post");
    var subID = req.params.id; //get the post id from url
    let newPost = req.body.postmsg; //get the post content from the text bar
    con.query('SELECT * from posts WHERE id = ?', [subID], function(err, posts, fields) {//query for the post with this id
        var x = posts[0]['id'];
        con.query("UPDATE posts SET postcontent = ?, user = ?, filled =? WHERE id = ?", [newPost, user, 1, subID], function (err, result) {//update the table
            con.query('SELECT * FROM posts WHERE id = ?', [x], function (err, getPost) {//query posts and comments to reload the page
                console.log("getPOST: " + getPost);
                con.query('SELECT * FROM Comments WHERE Postid = ?', [getPost[0]['id']], function (err, Comments) {
                    con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                        res.render('post.ejs', {username: user, title: 'post', post: getPost, Comments: Comments, followedForums:getForums});
                    })
                });

            });

            if (err) throw err;
            console.log(result.affectedRows + "record(s) updated");
        });
    });
});

app.post('/like-:id', (req,res)=>{
    console.log("likes your post");
    var subID = req.params.id//get the id from the url
    con.query('SELECT * from posts WHERE id = ?', [subID], function(err, posts, fields){
        con.query("SELECT * FROM posts WHERE id = ?", [subID], function(err,result1) {//query to get the number of likes on the post
            console.log(result1[0]['likes']);
            let x = result1[0]['likes'] + 1;//calculate new like total
            con.query("UPDATE posts SET likes = ? WHERE id = ?", [x, subID], function (err, result) {//update the likes
                console.log("result" + result);
                con.query('SELECT * FROM posts WHERE id = ?', [subID], function (err, getPost) {//query posts and comments to reload the page
                    console.log("getPOST: " + getPost);
                    con.query('SELECT * FROM Comments WHERE Postid = ?', [getPost[0]['id']], function (err, Comments) {
                        con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                            res.render('post.ejs', {username: user, title: 'post', post: getPost, Comments: Comments, followedForums:getForums});
                        })
                    });

                });
                if (err) throw err;
                console.log(result.affectedRows + "record(s) updated");
            });
        });
    });
});

app.post('/dislike-:id', (req,res)=>{//same as the like endpoint but it counts downvotes now
    console.log("dislikes your post");
    var subID = req.params.id
    con.query("SELECT * FROM posts WHERE id = ?", [subID], function(err,result1){
        console.log(result1[0]['dislikes']);
        let x = result1[0]['dislikes'] + 1;
        con.query("UPDATE posts SET dislikes = ? WHERE id = ?", [x , subID], function(err,result){
            console.log("result" + result);
            con.query('SELECT * FROM posts WHERE id = ?',[subID], function(err, getPost) {
                console.log("getPOST: " + getPost);
                con.query('SELECT * FROM Comments WHERE Postid = ?',[getPost[0]['id']], function(err, Comments){
                    con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                        res.render('post.ejs', {username: user, title: 'post', post: getPost, Comments: Comments, followedForums:getForums});
                    })
                });
            });
            if(err) throw err;
            console.log(result.affectedRows + "record(s) updated");
        });
    });
});

app.post('/comment-:id', (req,res)=>{
    console.log("making post");
    var subID = req.params.id//get post id from url
    let newPost = req.body.msg;//get content from text box
    con.query("INSERT INTO Comments (Postid, user, commentcontent, filled) VALUES (?, ?, ?, ?)",[subID, user, newPost, 1], function (err, result) {//insert the comment into the post with the taken id
        con.query('SELECT * FROM posts WHERE id = ?',[subID], function(err, getPost) {//query posts and comments to reload the page
            con.query('SELECT * FROM Comments WHERE Postid = ?',[subID], function(err, getComment) {
                console.log("getPOST: " + getPost);
                con.query('SELECT * FROM followed_forums WHERE user = ?', [user], function(error, getForums, fields) {
                    res.render('post.ejs', {username: user, title: 'post', post: getPost, Comments: getComment, followedForums:getForums});
                })
            });
        });
        if (err) throw err;
        console.log(result.affectedRows + "record(s) updated");
    });
})

//updates github in DB
app.post('/updateGitHub', (req, res) =>{
    console.log("Updating GitHub");
    let newGitHub = req.body.GHEdit;
    con.query( "UPDATE Profile_Info SET github = ? WHERE user = ?",[newGitHub, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

//updates twitter in DB
app.post('/updateTwitter', (req, res) =>{
    console.log("Updating Twitter");
    let newTwitter = req.body.TwitterEdit;
    con.query( "UPDATE Profile_Info SET twitter = ? WHERE user = ?",[newTwitter, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

//updates insta in DB
app.post('/updateInsta', (req, res) =>{
    console.log("Updating Instagram");
    let newGitHub = req.body.InstaEdit;
    con.query( "UPDATE Profile_Info SET insta = ? WHERE user = ?",[newGitHub, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

//updates facebook in DB
app.post('/updateFacebook', (req, res) =>{
    console.log("Updating Facebook");
    let newFacebook = req.body.FBEdit;
    console.log(newFacebook);
    con.query( "UPDATE Profile_Info SET facebook = ? WHERE user = ?",[newFacebook, user], function (err, result) {
        if (err) throw err;
        console.log(result.affectedRows + " record(s) updated");
    });
});

//save the profile picture to local storage
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

//will get the profile picture from the user, save the profile picture to local storage, sanitize the link, and save the link into the DB
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