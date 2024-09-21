const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const bcrypt = require("bcrypt");

let server, agent;

// Helper function to extract CSRF token from response
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Helper function to login
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/Roleassign").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
  return res;
};

describe("Role-Based Login and Educator Features", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000);
    agent = request.agent(server);

    await db.User.create({
      role: "Educator",
      name: "Educator User",
      email: "educator@example.com",
      password: await bcrypt.hash("password", 10),
    });

    await db.User.create({
      role: "Learner",
      name: "Learner User",
      email: "learner@example.com",
      password: await bcrypt.hash("password", 10),
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
    await server.close();
  });

  test("should allow Educator to login and redirect to Educator dashboard", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/Roleassign").send({
      email: "educator@example.com",
      password: "password",
      _csrf: csrfToken,
    });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe("/Educator_dashboard");
  });
  test("should allow Educator to create a course", async () => {
    // Login as Educator
    await login(agent, "educator@example.com", "password");

    let res = await agent.get("/createCourse");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/createCourse").send({
      courseName: "Test Course",
      courseDescription: "Test Course Description",
      _csrf: csrfToken,
    });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe("/Educator_dashboard");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    expect(course).not.toBeNull();
    expect(course.description).toBe("Test Course Description");
  });
  test("should allow Educator to create a chapter", async () => {
    // Login as Educator
    await login(agent, "educator@example.com", "password");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    let res = await agent.get(`/viewcourse/${course.id}/chapters/newchapter`);
    let csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/viewcourse/${course.id}/chapters/newchapter`)
      .send({
        chapterName: "Test Chapter",
        description: "Test Chapter Description",
        _csrf: csrfToken,
      });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`/viewcourse/${course.id}`);

    const chapter = await db.Chapter.findOne({
      where: { title: "Test Chapter" },
    });
    expect(chapter).not.toBeNull();
    expect(chapter.description).toBe("Test Chapter Description");
  });

  test("should allow Educator to create a chapter page", async () => {
    await login(agent, "educator@example.com", "password");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    const chapter = await db.Chapter.findOne({
      where: { title: "Test Chapter" },
    });
    // /viewcourse/:courseId/chapters/:chapterId/addcontent
    let res = await agent.get(
      `/viewcourse/${course.id}/chapters/${chapter.id}/addcontent`,
    );
    let csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/viewcourse/${course.id}/chapters/${chapter.id}/addcontent`)
      .send({
        contentTitle: "Test Content",
        chapterSelect: chapter.id,
        contentDescription: "Test Content Description",
        _csrf: csrfToken,
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`/viewcourse/${course.id}`);

    const content = await db.ChapterPages.findOne({
      where: { title: "Test Content" },
    });
    expect(content).not.toBeNull();
    expect(content.description).toBe("Test Content Description");
  });
  test("should allow Learner to login and redirect to Learner dashboard", async () => {
    let res = await agent.get("/login");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/Roleassign").send({
      email: "learner@example.com",
      password: "password",
      _csrf: csrfToken,
    });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe("/Learner_dashboard");
  });
  // test("should allow to forgot Password", async () => {
  //   let res = await agent.get("/forgetpassword");
  //   let csrfToken = extractCsrfToken(res);
  //   // console.log("CSRF forgotPass Token: ", csrfToken);
  //   const newPassword = "newpassword";
  //   const hashedPassword = await bcrypt.hash(newPassword, 10);
  //   console.log("Hashed Password: ", hashedPassword);

  //   res = await agent.post("/forgetpassword/User").send({
  //     email: "educator@example.com",
  //     password: hashedPassword,
  //     _csrf: csrfToken,
  //   });
  //   expect(res.status).toBe(302);
  //   expect(res.header.location).toBe("/login");
  // });
  test("should allow Learner to enroll in a course", async () => {
    // Login as Learner
    await login(agent, "learner@example.com", "password");
    const learner = await db.User.findOne({
      where: { email: "learner@example.com" },
    });

    const course = await db.Course.create({
      name: "Test Course",
      description: "Test Course Description",
    });
    let res = await agent.get(`/viewcourse/${course.id}`);
    let csrfToken = extractCsrfToken(res);
    res = await agent.post(`/enroll/${course.id}`).send({
      courseId: course.id,
      learnerId: learner.id,
      _csrf: csrfToken,
      enrollStatus: true,
    });
    expect(res.status).toBe(302);
    expect(res.header.location).toBe(`/viewcourse/${course.id}`);
  });
  test("should allow Learner to mark a chapter as completed", async () => {
    // Login as Learner
    await login(agent, "learner@example.com", "password");
    const learner = await db.User.findOne({
      where: { email: "learner@example.com" },
    });
    const course = await db.Course.create({
      name: "Test Course",
      description: "Test Course Description",
    });
    const chapter = await db.Chapter.create({
      title: "Test Chapter",
      description: "Test Chapter Description",
      courseId: course.id,
    });
    let res = await agent.get(
      `/viewcourse/${course.id}/chapters/${chapter.id}/content`,
    );
    let csrfToken = extractCsrfToken(res);
    res = await agent
      .post(
        `/viewcourse/${course.id}/chapters/${chapter.id}/content/markAsComplete`,
      )
      .send({
        chapetPageId: chapter.id,
        LearnerId: learner.id,
        markAsComple: true,
        _csrf: csrfToken,
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toBe(
      `/viewcourse/${course.id}/chapters/${chapter.id}/content`,
    );
  });
});
