const express = require("express");
const router = express.Router();
const User = require('../models/user');
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');



/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', async function (req, res, next) {
  const users = await User.all();
  return res.json(users)
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', async function (req, res, next) {
  const users = await User.get(req.params.username);
  return res.json(users)
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', async function (req, res, next) {

  try {
    const users = await User.messagesTo(req.params.username);
    return res.json(users)
  } catch (err) {
    return next(err)
  }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

// router.get('/', async function (req, res, next) {
//   const users = await User.all();
//   return res.json(users)
// })

module.exports = router;