const express = require("express");
const router = express.Router();
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({ username }, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    }
    throw new Error("Invalid username/password")
  }
  catch (err) {
    return next(err);
  }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
  try {
    // const { username, password, first_name, last_name, phone } = req.body;
    const user = await User.register({ username, password, first_name, last_name, phone } = req.body);
    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    return res.json({ token });
  }
  catch (err) {
    return next(err);
  }
})

module.exports = router;