/** User class for message.ly */
const { BCRYPT_WORK_ROUNDS } = require('../config');
const db = require('../db');
const bcrypt = require('bcrypt');


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, LOCALTIMESTAMP, LOCALTIMESTAMP)
        RETURNING username, password, first_name, last_name, phone;`,
      [username, hashedPassword, first_name, last_name, phone]);
    const user = result.rows[0];

    if (user) {
      return user;
    }
    throw new Error({ message: "User Registration failed" });
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      "SELECT password FROM users WHERE username = $1;",
      [username]);
    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password)) {
        await this.updateLoginTimestamp(username);
        return true
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let result = await db.query(
      "UPDATE users SET last_login_at = LOCALTIMESTAMP WHERE username = $1 RETURNING username, first_name, last_name",
      [username]);
    if (!result.rows[0]) {
      throw new Error('Unable to update timestamp')
    }
  }

  /** All: basic info on all users:
       * [{username, first_name, last_name}, ...] */

  static async all() {
    let results = await db.query(
      `SELECT username, first_name, last_name
      FROM users;`
    )
    if (!result.rows) {
      throw new Error('No users in the database')
    }
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1;`,
      [username]
    )
    if (!result.rows[0]) {
      throw new Error('No such user exists in the database')
    }

    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    let results = await db.query(
      `SELECT id, from_username AS from_user, body, sent_at, read_at
      FROM messages
      JOIN users
      ON users.username = messages.from_username
      WHERE users.username = $1;`,
      [username]
    )

    if (!result.rows) {
      throw new Error('Unable to locate any messages by user')
    }

    return results.rows;

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;