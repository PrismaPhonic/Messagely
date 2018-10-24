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
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let results = await db.query(
      "UPDATE users SET last_login_at = LOCALTIMESTAMP WHERE username = $1 RETURNING username, first_name, last_name",
      [username]);
    if (!results.rows[0]) {
      throw new Error('Unable to update timestamp')
    }
  }

  /** Add reset code to user row */

  static async addResetCode(username, resetCode) {
    let results = await db.query(
      "UPDATE users SET reset_code = $1 WHERE username = $2 RETURNING username",
      [resetCode, username]);
    if (!results.rows[0]) {
      throw new Error('Unable to add reset code')
    }
  }

  /** Update user password */

  static async updatePassword(username, resetCode, newPassword) {
    let results = await db.query(`
      SELECT reset_code FROM users WHERE username = $1;
    `,
      [username]);

    const reset_code = results.rows[0].reset_code;
    console.log(reset_code);
    if (reset_code !== resetCode) {
      throw new Error(`Incorrect reset code!`);
    }

    const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_WORK_ROUNDS);

    // setting hashed password and also setting reset_code to NULL so it can't
    // be used again
    results = await db.query(
      "UPDATE users SET password = $1, reset_code = NULL WHERE username = $2 RETURNING username",
      [newHashedPassword, username]);

    if (!results.rows[0]) {
      throw new Error('Unable to update password')
    }


    return true;
  }


  /** All: basic info on all users:
       * [{username, first_name, last_name}, ...] */

  static async all() {
    let results = await db.query(
      `SELECT username, first_name, last_name
      FROM users;`
    )
    if (results.rows.length === 0) {
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
    if (!results.rows[0]) {
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
      `SELECT id, to_username AS to_user, body, sent_at, read_at
      FROM messages
      JOIN users
      ON users.username = messages.from_username
      WHERE users.username = $1;`,
      [username]
    )
    const messages = results.rows;

    const toUserPromises = messages.map(row => {
      return db.query(
        `SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1;`,
        [row.to_user]
      )
    })

    const to_users = await Promise.all(toUserPromises);

    for (let i = 0; i < messages.length; i++) {
      messages[i].to_user = to_users[i].rows[0];
    }

    if (results.rows.length === 0) {
      throw new Error('Unable to locate any messages sent from user')
    }

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let results = await db.query(
      `SELECT id, from_username AS from_user, body, sent_at, read_at
      FROM messages
      JOIN users
      ON users.username = messages.to_username
      WHERE users.username = $1;`,
      [username]
    )

    const messages = results.rows;

    const fromUserPromises = messages.map(row => {
      return db.query(
        `SELECT username, first_name, last_name, phone
        FROM users
        WHERE username = $1;`,
        [row.from_user]
      );
    })

    const from_users = await Promise.all(fromUserPromises);

    for (let i = 0; i < messages.length; i++) {
      messages[i].from_user = from_users[i].rows[0];
    }

    if (results.rows.length === 0) {
      throw new Error('Unable to locate any messages sent to user')
    }

    return messages;
  }
}


module.exports = User;