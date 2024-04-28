const jwt = require("jsonwebtoken");

function createJwt(payload, expiresIn, key) {
  const token = jwt.sign({ payload }, key, {
    expiresIn: expiresIn,
  });
  return token;
}

function isTokenValid(token, key) {
  try {
    const response = jwt.verify(token, key);
    return response;
  } catch (err) {
    return false;
  }
}

module.exports = { createJwt, isTokenValid };
