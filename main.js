const express = require('express')
var path = require('path');
const response = require("express");
const createError = require("http-errors");

const app = express();
const port = 3000;

app.set("views",path.resolve(__dirname,"views"));
app.set("view engine","ejs");

app.use(express.static(path.join(__dirname,'public')));

app.get("/", function(req,res){
    res.render("index", {title:"This is a title",message:"This is a message"});
});
app.get("/test", function(req,res){
    res.render("test", {title:"This is a title",message:"This is a message"});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
