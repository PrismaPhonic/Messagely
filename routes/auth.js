const express = require("express");
const router = express.Router();
const User = require('../models/user');
const sendSMS = require('../models/message').sendSMS;
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');
const { generateResetCode } = require('../middleware/auth');


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

/** POST /reset - reset: {username} => 'SMS sent!'
 *
 * Send user text message of reset code
 *
 **/

router.post("/reset", async function (req, res, next) {
  try {
    const { username } = req.body;
    //check if user is in database
    const user = await User.get(username);
    // user exists, let's generate code
    const resetCode = generateResetCode();
    // add reset code to database for users row
    User.addResetCode(username, resetCode);
    // send the sms to the user
    let sid = await sendSMS(`Your reset code is: ${resetCode}`, '+19168274299', user.phone);
    return res.json({ sid });
  }
  catch (err) {
    return next(err);
  }
})

/** POST /update - update: {username, resetCode, newPassword} 
 *                          => 'password updated!'
 * 
 * Update user password if reset code is correct
 *
 **/

router.post("/update", async function (req, res, next) {
  try {
    const { username, resetCode, newPassword } = req.body;
    if (await User.updatePassword(username, +resetCode, newPassword)) {
      return res.json({ message: "Password Updated" })
    }
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