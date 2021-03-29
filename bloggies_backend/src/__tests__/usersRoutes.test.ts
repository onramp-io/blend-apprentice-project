
import request from "supertest"
import app from "../app";
import db from "../db";
import { NONE } from "../membershipStatuses";
import * as m from "./mocks";
import { makeNewUser } from "./makeFunctions";

const TEST_PASSWORD = "password";

describe("Test User routes", function () {
  beforeEach(async function () {
    await reset();
    await makeNewUser(m.TEST_EMAIL, TEST_PASSWORD, m.TEST_DISPLAY_NAME);
  });

  /** POST /user-auth/register => status 201, { user, token } */
  test("POST /user-auth/register - Create new user", async function () {
    const NEW_USER_EMAIL = "userRouteTest@test.com";
    const NEW_USER_DISPLAY_NAME = "uwuuwu";

    const resp = await request(app)
      .post(`/user-auth/register`)
      .send({
        email: NEW_USER_EMAIL,
        password: "password",
        display_name: NEW_USER_DISPLAY_NAME
      });
    let user = resp.body.user;
    expect(resp.status).toBe(201);
    expect(user).toStrictEqual({
      id: expect.any(Number),
      email: NEW_USER_EMAIL,
      display_name: NEW_USER_DISPLAY_NAME,
      membership_status: NONE,
      membership_start_date: null,
      membership_end_date: null,
      last_submission_date: null
    });
  });

  /** POST /user-auth/register => status 400, { error } */
  test("INVALID POST /user-auth/register - handle bad values to register", async function () {
    const resp = await request(app)
      .post(`/user-auth/register`)
      .send({
        username: "",
        password: "password",
        display_name: "user route test"
      });

    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("Invalid registration values. Check all fields.");
  });

  /** POST /users/register => status 400, { error } */
  test("INVALID POST /user-auth/register - handle duplicate email register", async function () {
    const resp = await request(app)
      .post(`/user-auth/register`)
      .send({
        email: m.TEST_EMAIL,
        password: "password",
        display_name: m.TEST_DISPLAY_NAME
      });

    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("Email already exists");
  });

  /** POST /users/login  => status 200, { user, token } */
  test("POST /user-auth/login - login a user", async function () {
    const resp = await request(app)
      .post(`/user-auth/login`)
      .send({
        email: m.TEST_EMAIL,
        password: TEST_PASSWORD
      });
    let user = resp.body.user;
    expect(resp.status).toBe(200);
    expect(user).toStrictEqual({
      id: expect.any(Number),
      email: m.TEST_EMAIL,
      display_name: m.TEST_DISPLAY_NAME,
      membership_status: NONE,
      membership_start_date: null,
      membership_end_date: null,
      last_submission_date: null,
      customer_id: null,
      subscription_id: null
    });
  });

  /** POST /users/login  => status 400, { error } */
  test("INVALID POST /user-auth/login - handle login a non-existant", async function () {
    const resp = await request(app)
      .post(`/user-auth/login`)
      .send({
        email: "idontexist@test.com",
        password: "password"
      });
    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("User does not exist, please try again");
  });

  /** POST /users/login  => status 400, { error } */
  test("INVALID POST /user-auth/login - handle login a bad password", async function () {
    const resp = await request(app)
      .post(`/user-auth/login`)
      .send({
        email: m.TEST_EMAIL,
        password: "wrongpassword"
      });
    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("Credentials do not match, please try again");
  });

  /** GET /users/search  => status 200, { users } */
  test("GET /users/search - search for a user with a search term", async function () {
    const resp = await request(app)
      .get(`/users/search?term=milktea`);
    expect(resp.status).toBe(200);
    expect(resp.body.users.length).toBe(1);
    expect(resp.body.users[0].display_name).toBe(m.TEST_DISPLAY_NAME);
  });

  afterAll(async () => {
    await reset();
    await db.end();
  });
});

async function reset() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM user_auth");
}