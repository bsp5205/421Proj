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
    res.render("index", {title:"Home"});
});
app.get("/post_name", function(req,res){
    res.render("post", {title:"Generic Post Title", post_content:"post content"});
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
