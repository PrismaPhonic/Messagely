/** Message class for message.ly */



/** Message on the site. */

class Message {

  /** register new message -- returns
   *    {id, from_username, to_username, body, sent_at}
   */

  static async create({ from_username, to_username, body }) {
    const results = await db.query(
      `INSERT INTO messages (from_username, to_username, body, sent_at)
      VALUES ($1, $2, $3, LOCALTIMESTAMP)
      RETURNING id, from_username, to_username, body, sent_at;`,
      [from_username, to_username, body]
    );

    if (!results.rows[0]) {
      throw new Error('Unable to create new message')
    }

    return results.rows[0]
  }

  /** Update read_at for message */

  static async markRead(id) {
    const results = await db.query(
      `UPDATE messages
      SET read_at = LOCALTIMESTAMP
      WHERE id = $1
      RETURNING id;`,
      [id]
    )

    if (!results.rows[0]) {
      throw new Error('Unable to mark message as read')
    }
  }

  /** Get: get message by id
   *
   * returns {id, from_user, to_user, body, sent_at, read_at}
   *
   * both to_user and from_user = {username, first_name, last_name, phone}
   
   
    {id: id ,
      to_user: {usernmae, first_name, last_name, phone},
      from_user: {username, first_name, last_name, phone}
     }
   
   
   
   */

  static async get(id) {
    let results = await db.query(
      `SELECT id, from_username
      AS from_user, to_username
      AS to_user, body, sent_at, read_at
      FROM messages
      WHERE id = $1;`,
      [id]
    )

    const message = results.rows[0]

    if (!message) {
      throw new Error('No message by id')
    }

    let results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users
      WHERE username = $1;`,
      [message.from_user]
    )

    const from_user = results.rows[0]
    if (!from_user) {
      throw new Error('Unable to find from_user')
    }

    let results = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users
      WHERE username = $1;`,
      [message.to_user]
    )

    const to_user = results.rows[0]
    if (!to_user) {
      throw new Error('Unable to find to_user')
    }

    message.from_user = from_user;
    message.to_user = to_user;
    return message
  }
}


module.exports = Message;