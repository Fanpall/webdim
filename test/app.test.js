const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

const uniqueId = Date.now();
const username = `user${uniqueId}`;
const password = "secret123";

let authToken;

test("GET / returns 200 and contains title", async () => {
  const response = await request(app).get("/");
  assert.equal(response.status, 200);
  assert.match(response.text, /CRUD/i);
});

test("POST /api/auth/register creates a new user and returns token", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ username, password });

  assert.equal(response.status, 201);
  assert.ok(response.body.token);
  assert.equal(response.body.username, username);
  authToken = response.body.token;
});

test("POST /api/auth/login returns a token", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ username, password });

  assert.equal(response.status, 200);
  assert.ok(response.body.token);
});

test("GET /api/students returns 401 without token", async () => {
  const response = await request(app).get("/api/students");
  assert.equal(response.status, 401);
});

test("GET /api/students returns a list with token", async () => {
  const response = await request(app)
    .get("/api/students")
    .set("Authorization", `Bearer ${authToken}`);

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.body), true);
});

test("POST /api/students creates a new student with token", async () => {
  const response = await request(app)
    .post("/api/students")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ nama: "Budi", nim: "2024001", jurusan: "Teknik Informatika" });

  assert.equal(response.status, 201);
  assert.equal(response.body.nama, "Budi");
});

test("GET /api/students?search=zzz returns an empty list for unknown keywords", async () => {
  const response = await request(app)
    .get("/api/students?search=zzz")
    .set("Authorization", `Bearer ${authToken}`);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, []);
});
