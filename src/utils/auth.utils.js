const bcrypt = require("bcrypt");

const attachCookie = (token, res, name) => {
  res.cookie(name, token, {
    httpOnly: process.env.NODE_ENV === this.production ? true : false,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    secure: true,
    signed: false,
    sameSite: "lax",
    // domain: ["*"],
  });
};

const clearCookie = (res, name) => {
  res.clearCookie(name, {
    path: "/",
    // domain: ["*"],
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  let hashed = await bcrypt.hash(password, salt);
  return hashed;
};

const comparePassword = async (password, hashedPassword) => {
  let isSame = await bcrypt.compare(password, hashedPassword);
  return isSame;
};

module.exports = {
  attachCookie,
  clearCookie,
  hashPassword,
  comparePassword,
};
