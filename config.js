/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "secret";
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const BCRYPT_WORK_ROUNDS = 10;


module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_ROUNDS,
  AUTH_TOKEN,
  ACCOUNT_SID
};