const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");
const sql = require('mysql');


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

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
});
