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
const connectEnsureLogin = require("connect-ensure-login");

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
const {
  User,
  Course,
  Chapter,
  ChapterPages,
  enrollCourse,
  markAsCompletion,
} = require("./models");

app.get("/", (req, res) => {
  res.render("index", { title: "LMS Portal", csrfToken: req.csrfToken() });
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup", csrfToken: req.csrfToken() });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login", csrfToken: req.csrfToken() });
});

app.get("/forgetpassword", (req, res) => {
  res.render("forgetpassword", {
    title: "Forget Password",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", async (request, response, next) => {
  //Signout
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get(
  "/Educator_dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userDetail = await User.findOne({ where: { id: userId } });
      const name = userDetail.name;
      const Role = userDetail.role;
      const viewcourses = await Course.getCourseByEducatorId();
      const userRole = req.user.role;
      console.log("viewcourses", viewcourses);
      // console.log("name", userDetail);
      if (req.accepts("html")) {
        res.render("Educator_dashboard", {
          title: "Educator Dashboard",
          csrfToken: req.csrfToken(),
          name,
          Role,
          userId,
          viewcourses,
          userRole,
        });
      } else {
        res.json({ name, Role, userId, viewcourses });
      }
    } catch (error) {
      console.log(error);
    }
  },
);

app.get(
  "/Learner_dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Learner"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const learnerId = req.user.id;

      const enrollments = await enrollCourse.findAll({
        where: { LearnerId: learnerId },
        include: [{ model: Course, as: "course" }],
      });

      const isEnrolled = enrollments.length > 0;

      // console.log("userRole", userRole);
      const user = await User.findOne({ where: { id: userId } });
      const viewcourses = await Course.getCourseByEducatorId();
      console.log("user", user);
      console.log("viewcourses", viewcourses);
      if (req.accepts("html")) {
        res.render("Learner_dashboard", {
          title: "Learner Dashboard",
          csrfToken: req.csrfToken(),
          user,
          userRole,
          viewcourses,
          isEnrolled, // Pass the enrollment status to the template
          enrollments, // Pass the list of enrollments to the template
        });
      } else {
        res.json({ name });
      }
    } catch (error) {
      console.log(error);
    }
  },
);

app.get(
  "/createCourse",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    try {
      if (req.accepts("html")) {
        res.render("createCourse", {
          title: "Create Course",
          csrfToken: req.csrfToken(),
        });
      } else {
        res.json();
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log(error);
    }
  },
);

app.get(
  "/viewcourse/:id",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator", "Learner"]),
  async (req, res) => {
    try {
      courseId = req.params.id;
      const learnerId = req.user.id;
      console.log("courseId", courseId);
      const existingEnrollment = await enrollCourse.findOne({
        where: { LearnerId: learnerId, courseId: courseId },
      });
      const viewcourses = await Course.findOne({ where: { id: courseId } });
      const chapters = await Chapter.findAll({ where: { courseId: courseId } });
      console.log("chapters: ", chapters);
      const userRole = req.user.role;
      console.log("viewcourses", viewcourses);
      if (req.accepts("html")) {
        res.render("Chepter", {
          title: "Create Chepter",
          csrfToken: req.csrfToken(),
          viewcourses,
          chapters,
          userRole,
          existingEnrollment,
        });
      } else {
        res.json({ viewcourses });
      }
    } catch (error) {
      console.log(error);
    }
  },
);

app.get(
  "/viewcourse/:id/chapters/newchapter",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    courseID = req.params.id;
    console.log("courseId", courseID);
    res.render("newChepter", {
      title: "Create Chepter",
      courseID,
      csrfToken: req.csrfToken(),
    });
  },
);

app.get(
  "/viewcourse/:courseId/chapters/:chapterId/addcontent",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;

      const course = await Course.findOne({ where: { id: courseId } });
      console.log("course", course);
      const chapter = await Chapter.findOne({
        where: { id: chapterId, courseId: courseId },
      });
      const chapters = await Chapter.findAll({ where: { courseId: courseId } });

      if (!course || !chapter) {
        return res.status(404).json({ error: "Course or Chapter not found" });
      }
      console.log("CSRF Token of get:", req.csrfToken());
      res.render("addcontent", {
        title: "Add Content",
        csrfToken: req.csrfToken(),
        course,
        chapter,
        chapters, // Pass the list of chapters to the template
      });
    } catch (error) {
      console.error("Error fetching course or chapter details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.get(
  "/viewcourse/:courseId/chapters/:chapterId/content",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator", "Learner"]),
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;
      learnerId = req.user.id;
      const course = await Course.findOne({ where: { id: courseId } });
      const chapter = await Chapter.findOne({
        where: { id: chapterId, courseId: courseId },
      });
      const content = await ChapterPages.findAll({
        where: { chapterID: chapterId },
      });
      const completion = await markAsCompletion.findOne({
        where: {
          chapetPageId: chapterId,
          LearnerId: learnerId,
          markAsComple: true,
        },
      });
      const userRole = req.user.role;
      // console.log("completion", completion);
      const isCompleted = !!completion;
      // console.log("isCompleted", isCompleted);
      // console.log("CSRF Token of get:", req.csrfToken());
      const nextChapter = await Chapter.nextChapter(courseId, chapterId);
      console.log("nextChapter", nextChapter);

      if (req.accepts("html")) {
        res.render("viewContent", {
          title: "View Content",
          csrfToken: req.csrfToken(),
          course,
          chapter,
          content,
          chapterId,
          courseId,
          isCompleted,
          nextChapter,
          userRole,
        });
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post("/forgetpassword/User", async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  if (user) {
    if (req.body.newpass === req.body.confirmpass) {
      let Hashpass = await bcrypt.hash(req.body.newpass, saltRound);
      await User.update(
        { password: Hashpass },
        { where: { email: req.body.email } },
      );
      console.log("Password Updated");
      return res.redirect("/login");
    }
    // return res.redirect("/forgetpassword");
  }
  res.redirect("/login");
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
    return res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
  res.redirect("/");
});

app.post(
  "/createCourse",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("createCourse body:", req.body);
    const EducatorId = req.user.id;
    console.log("EducatorId", EducatorId);
    try {
      await Course.create({
        name: req.body.courseName,
        description: req.body.courseDescription,
        educatorId: req.user.id,
        educatorName: req.user.name,
      });
      return res.redirect("/Educator_dashboard");
    } catch (error) {
      console.log("Error creating course:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/viewcourse/:courseID/chapters/newchapter",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    console.log("newchapter body:", req.body);
    const courseId = req.params.courseID;
    console.log("courseId", courseId);
    try {
      await Chapter.create({
        title: req.body.chapterName,
        description: req.body.description,
        courseId: courseId,
      });
      return res.redirect(`/viewcourse/${courseId}`);
    } catch (error) {
      console.log(error);
    }
  },
);

app.post(
  "/viewcourse/:courseId/chapters/:chapterId/addcontent",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Educator"]),
  async (req, res) => {
    try {
      // console.log("contentDescription :", req.body);
      // console.log("chapterID", req.body.chapterSelect);
      console.log("CSRF addcontent POST TOKEN:", req.csrfToken());
      const courseId = req.params.courseId;
      await ChapterPages.create({
        title: req.body.contentTitle,
        chapterID: req.body.chapterSelect,
        description: req.body.contentDescription,
      });
      res.redirect(`/viewcourse/${courseId}`);
    } catch (error) {
      console.error("Error adding content:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/enroll/:courseId",
  connectEnsureLogin.ensureLoggedIn(),
  requireRoles(["Learner"]),
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const learnerId = req.user.id;
      // Check if the learner is already enrolled in the course
      const existingEnrollment = await enrollCourse.findOne({
        where: { LearnerId: learnerId, courseId: courseId },
      });
      console.log("existingEnrollment", existingEnrollment);
      if (existingEnrollment) {
        return res
          .status(400)
          .json({ message: "You are already enrolled in this course." });
      }
      await enrollCourse.create({
        LearnerId: learnerId,
        courseId: courseId,
        progressOfCourse: 0,
        enrollStatus: true,
      });
      res.redirect(`/viewcourse/${courseId}`);
    } catch (error) {
      console.error("Error enrolling in course:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/viewcourse/:courseId/chapters/:chapterId/content/markAsComplete",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const { courseId, chapterId } = req.params;
      const learnerId = req.user.id;

      // Update the markAsCompletion model
      await markAsCompletion.create({
        chapetPageId: chapterId,
        LearnerId: learnerId,
        markAsComple: true,
      });
      res.redirect(`/viewcourse/${courseId}/chapters/${chapterId}/content`);
      // res.status(200).json({ message: "Chapter marked as complete" });
    } catch (error) {
      console.error("Error marking chapter as complete:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

module.exports = app;
