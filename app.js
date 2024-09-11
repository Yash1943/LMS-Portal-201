/* eslint-disable no-undef  */
/* eslint-disable no-unreachable  */
const express = require("express");
const app = express();
// for session managment
var csurf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser"); //for Read the post req of the body
// const flash = require("connect-flash"); // for flash massages
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false })); //for understanding the url data

app.use(cookieParser("shh! some secret here"));
app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

//Model import

const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
// const connectEnsureLogin = require("connect-ensure-login");

const saltRound = 10;

app.set("view engine", "ejs"); // for EJS rendering
app.use(express.static(path.join(__dirname + "public"))); // for static files
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "my-super-secret-key-2021095900023267",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          if (!user) {
            return done(null, false, { message: "username does not exist." });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user, { massage: "User Logged in" });
            console.log("User Logged in", user);
          } else {
            return done(null, false, { massage: "Incorrect password." });
          }
        })
        .catch((error) => {
          return done(error);
        });
    },
  ),
);

passport.serializeUser((user, done) => {
  console.log("serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const requireRoles = (roles) => {
  return (request, response, next) => {
    if (request.user && roles.includes(request.user.role)) {
      return next();
    } else {
      response.status(401).json({ message: "Unauthorized user." });
    }
  };
};
const { User } = require("./models");

app.get("/", (req, res) => {
  res.render("index", { title: "LMS Portal", csrfToken: req.csrfToken() });
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", csrfToken: req.csrfToken() });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login", csrfToken: req.csrfToken() });
});

app.post(
  "/Roleassign",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  async (req, res) => {
    try {
      const user = await User.findOne({ where: { email: req.user.email } });
      if (!user) {
        return res.redirect("/login");
      }

      const role = user.role;
      console.log("Roleassign : ", role);

      if (role === "Educator") {
        return res.redirect("/Educator_dashboard");
      } else if (role === "Learner") {
        return res.redirect("/Learner_dashboard");
      } else {
        return res.redirect("/login");
      }
    } catch (error) {
      console.error("Error during role assignment:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.get("/Educator_dashboard", requireRoles(["Educator"]), (req, res) => {
  res.render("Educator_dashboard", {
    title: "Educator Dashboard",
    csrfToken: req.csrfToken(),
  });
});

app.get("/Learner_dashboard", requireRoles(["Learner"]), (req, res) => {
  res.render("Learner_dashboard", {
    title: "Learner Dashboard",
    csrfToken: req.csrfToken(),
  });
});

app.post("/users", async (req, res) => {
  const hashedpwd = await bcrypt.hash(req.body.password, saltRound);
  console.log("hashpass", hashedpwd);
  try {
    await User.create({
      role: req.body.role,
      name: req.body.name,
      email: req.body.email,
      password: hashedpwd,
    });
    // console.log(user);
    return res.redirect("/Home");
  } catch (error) {
    console.log(error);
  }
  res.redirect("/");
});

module.exports = app;
