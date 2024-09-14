const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const bcrypt = require("bcrypt");

let server, agent;
let csrfToken;
// let educator;

// Helper function to extract CSRF token from response
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Helper function to login
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/users").send({
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

  it("should allow Educator to login and redirect to Educator dashboard", async () => {
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

  it("should allow Learner to login and redirect to Learner dashboard", async () => {
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

  it("should allow Educator to create a course", async () => {
    // Login as Educator
    await login(agent, "educator@example.com", "password");

    let res = await agent.get("/createCourse");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/createCourse").send({
      courseName: "Test Course",
      courseDescription: "Test Course Description",
      _csrf: csrfToken,
    });
    expect(res.status).toBe(500);
    expect(res.header.location).toBe("/Educator_dashboard");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    expect(course).not.toBeNull();
    expect(course.description).toBe("Test Course Description");
  });

  it("should allow Educator to create a chapter", async () => {
    // Login as Educator
    await login(agent, "educator@example.com", "password");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    let res = await agent.get(`/viewcourse/${course.id}/chapters/newchapter`);
    csrfToken = extractCsrfToken(res);
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

  it("should allow Educator to create a chapter page", async () => {
    // Login as Educator
    await login(agent, "educator@example.com", "password");

    const course = await db.Course.findOne({ where: { name: "Test Course" } });
    const chapter = await db.Chapter.findOne({
      where: { title: "Test Chapter" },
    });
    let res = await agent.get(
      `/viewcourse/${course.id}/chapters/${chapter.id}/addcontent`,
    );
    csrfToken = extractCsrfToken(res);
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
});
