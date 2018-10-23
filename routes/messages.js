const express = require("express");
const router = express.Router();
const Message = require('../models/message');
const { ensureLoggedIn, ensureCorrectUser, isCorrectMessageUser, isReceivingMessageUser } = require('../middleware/auth');
const { SECRET_KEY } = require('../config');
const jwt = require('jsonwebtoken');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async function (req, res, next) {
  try {
    const message = await Message.get(req.params.id);
    if (isCorrectMessageUser(req, message)) {
      return res.json(message)
    } else {
      throw new Error('You are not authorized to read that message');
    }
  }
  catch (err) {
    return next(err)
  }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function (req, res, next) {
  try {
    return res.json(await Message.create(req.body));
  }
  catch (err) {
    return next(err)
  }
});



/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async function (req, res, next) {
  try {
    if (await isReceivingMessageUser(req, req.params.id)) {
      return res.json({ message: await Message.markRead(req.params.id) });
    }
    throw new Error('Unauthorized - You are not the receiving message user')
  }
  catch (err) {
    return next(err)
  }
});


module.exports = router;