const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");
const sql = require('mysql');
var passport = require('passport');
var bodyParser = require('body-parser');
var localStrategy = require('passport-local').Strategy;

const app = express();
const port = 3000;

var UserList = [{username:'admin',password:'admin'}];

app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());

app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

passport.use('local', new localStrategy(
    function(username, password, done) {

        var Check_user = username;
        var Info = UserList.find((element) => {
            if (element.username == Check_user) {
                return element;
            }
        });

        console.log("Auth found this " + Info);
        if (Info == undefined || Info == null) {
            return done(null, false, {message: 'Incorrect username'});
        }
        if (Info.password != password) {
            return done(null, false, {message: 'Incorrect password'});
        } else {
            console.log("Accepted");
            return done(null, Info);
        }
    }
));

app.post('/login', passport.authenticate('local',{
        successRedirect: "/",
        failureRedirect: "/login-failed",
        session:false
    })
);

app.use(express.static(path.join(__dirname,'public')));


app.get("/", function(req,res){
    res.render("index", {title:"FUABAR | Home",message:"This is a message"});
});

app.get("/login", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message:""});
});

app.get("/login-failed", (req, res) => {
    res.render("login.ejs", {title: "FUBAR | Login", message: "Username or password incorrect. Please try again."});
});

app.get("/signup", (req,res) =>{
    res.render("signup.ejs", {title: "FUBAR | Sign Up"})
});

app.get("/post_name", (req, res) => {
    res.render("post", {title:"Post Title", post_content:"Post content"});
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
