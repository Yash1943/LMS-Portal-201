/* eslint-disable no-undef  */
/* eslint-disable no-unreachable  */
const express = require("express");
const app = express();
// for session managment
// var csurf = require("csurf");
var csurf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser"); //for Read the post req of the body
// const flash = require("connect-flash"); // for flash massages
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); //for understanding the url data

app.use(cookieParser("shh! some secret here"));
app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

// const passport = require("passport");
// const LocalStrategy = require("passport-local");
// const session = require("express-session");
// const connectEnsureLogin = require("connect-ensure-login");
// const bcrypt = require("bcrypt");

app.set("view engine", "ejs"); // for EJS rendering
app.use(express.static(path.join(__dirname + "public"))); // for static files
app.set("views", path.join(__dirname, "views"));

module.exports = app;
