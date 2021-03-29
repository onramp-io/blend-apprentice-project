import User from "../models/user";
import db from "../db";
import { NONE } from "../membershipStatuses";
import * as m from "./mocks";

let validUserId: number;

/** Tests for User model */
describe("Test User class", function () {
  beforeAll(async function () {
    await reset();

    const userAuthRes = await db.query(
      `INSERT INTO user_auth (email, hashed_pwd)
      VALUES ($1, $2)
      RETURNING id`,
      [m.TEST_EMAIL, 'password']);

    validUserId = userAuthRes.rows[0].id;

    await db.query(
      `INSERT INTO users (user_id, display_name)
      VALUES ($1, $2)`,
      [validUserId, m.TEST_DISPLAY_NAME]);
  });

  test("can retrieve user", async function () {
    const user = await User.getUser(validUserId);
    expect(user).toEqual({
      id: validUserId,
      display_name: m.TEST_DISPLAY_NAME,
      membership_status: NONE,
      membership_start_date: null,
      membership_end_date: null,
      last_submission_date: null,
      customer_id: null,
      subscription_id: null
    });
  });

  test("can search users", async function () {
    const users = await User.searchUsers(m.TEST_DISPLAY_NAME);
    expect(users[0]).toEqual({
      id: validUserId,
      display_name: m.TEST_DISPLAY_NAME,
      last_submission_date: null
    });
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