const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const CustomError = require("../utils/customError");
const { isTokenValid } = require("../utils/jwt.utils");

const verifyToken = (req, res, next) => {
  let temp = req.headers?.cookie;
  let token = temp?.split("token=")[1];
  console.log(token)
  if (!token) {
    throw new CustomError(
      "Token not present. Please login again!",
      StatusCodes.UNAUTHORIZED
    );
  }

  try {
    const tokenResponse = isTokenValid(token, process.env.TOKEN_SECRET);
    if (!tokenResponse) {
      throw new CustomError(
        "Invalid token. Please login again!",
        StatusCodes.UNAUTHORIZED
      );
    }
    const id = tokenResponse.payload.id;

    if (!mongoose.isValidObjectId(id))
      throw new CustomError("Invalid user ID!", StatusCodes.BAD_REQUEST);

    req.user = { id };
    return next();
  } catch (err) {
    throw new CustomError(err.message, StatusCodes.FORBIDDEN);
  }
};

module.exports = verifyToken;
