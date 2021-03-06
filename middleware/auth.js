/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config.js");
const Message = require('../models/message');

/** Middleware: Requires user is logged in. */

function ensureLoggedIn(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    let { username } = jwt.verify(token, SECRET_KEY);
    // put username on request as a convenience for routes
    req.username = username;
    return next();
  }

  catch (err) {
    return next({ status: 401, message: "Unauthorized" });
  }
}

/** Middleware: Requires :username is logged in. */

function ensureCorrectUser(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    const payload = jwt.verify(token, SECRET_KEY);
    if (payload.username === req.params.username) {
      // put username on request as a convenience for routes
      req.username = payload.username;
      return next();
    } else {
      throw new Error();
    }
  }

  catch (err) {
    return next({ status: 401, message: "Unauthorized" });
  }
}

function isCorrectMessageUser(req, message) {
  return (req.username === message.to_user.username || req.username === message.from_user.username);
}

async function isReceivingMessageUser(req, messageId) {
  const message = await Message.get(messageId);
  return (req.username === message.to_user.username)
}

function generateResetCode() {
  return Math.floor(Math.random() * (999999 - 100000) + 100000);
}

module.exports = {
  ensureLoggedIn,
  ensureCorrectUser,
  isCorrectMessageUser,
  isReceivingMessageUser,
  generateResetCode
};