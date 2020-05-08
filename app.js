var path = require('path');
var route = require(path.join(__dirname,'app_server/routes/route'));
var express = require('express');
var ejsLayouts = require('express-ejs-layouts');
var bodyparser = require('body-parser');
var db = require('./app_server/models/db');
session = require('express-session');
var cookieParser = require('cookie-parser');
const fileUpload = require("express-fileupload");

var app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/app_server/views'));

app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
app.use(cookieParser());
app.use(ejsLayouts);
app.use(fileUpload());
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use('/public', express.static('public'));
app.use('/', route);


const port = 3000
app.listen(port, () => console.log(`Crypted Chat app listening at http://localhost:${port}`))