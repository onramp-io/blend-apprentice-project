import db from "../db";
import Comment from "../models/comment";
import * as m from "./helpers/mocks";

let validUserId: number;
let validPostId: number;

/** Tests for Comment model */
describe("Test comment class", function () {
  beforeEach(async function () {
    await reset();

    const userAuthRes = await db.query(
      `INSERT INTO user_auth (email, hashed_pwd)
        VALUES ($1, $2)
        RETURNING id`,
      [m.TEST_EMAIL, "password"]);
    validUserId = userAuthRes.rows[0].id;

    await db.query(
      `INSERT INTO users (user_id, display_name)
        VALUES ($1, $2)`,
      [validUserId, m.TEST_DISPLAY_NAME]);

    const postRes = await db.query(
      `INSERT INTO posts(title, description, body, author_id, is_premium) 
        VALUES
            ($1, $2, 'Body text description goes here', $3, false)
        RETURNING id`,
      [m.TEST_POST_TITLE, m.TEST_POST_DESC, validUserId]);
    validPostId = postRes.rows[0].id;

    await db.query(
      `INSERT INTO comments (body, post_id, author_id, is_reply) 
        VALUES ($1, ${validPostId}, ${validUserId}, false)`,
      [m.TEST_COMMENT_BODY]);
  });

  test("can create a new comment", async function () {
    const post = await Comment.createComment("Test comment", validPostId, validUserId, false);

    const foundPostRes = await db.query(`SELECT body, author_id FROM comments WHERE post_id = ${validPostId}`);
    const foundPost = foundPostRes.rows[1];

    expect(post.created_at).toBeDefined();
    expect(foundPost.body).toBe("Test comment");
    expect(foundPost.author_id).toBe(validUserId);
  });

  test("can get comments by post id", async function () {
    const res = await Comment.getCommentsByPostId(validPostId);
    expect(res.comments.length).toEqual(1);
    expect(res.comments[0].body).toEqual(m.TEST_COMMENT_BODY);
  });

  test("can handle invalid post_id when creating new comment", async function () {
    try {
      await Comment.createComment("Test unhappy comment post", 9999, validUserId, false);
    } catch (err) {
      expect(err.message).toBe("Invalid author_id/post_id");
      expect(err.status).toBe(400);
    }
  });

  afterAll(async () => {
    await reset();
    await db.end();
  });
});

async function reset() {
  await db.query("DELETE FROM posts");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM comments");
  await db.query("DELETE FROM user_auth");
  await db.query("ALTER SEQUENCE posts_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE user_auth_id_seq RESTART WITH 1");
  await db.query("ALTER SEQUENCE comments_id_seq RESTART WITH 1");
}