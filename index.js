const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const root_dir = __dirname.split("src")[0];
dotenv.config({ path: path.join(root_dir, `.env`) });
const { StatusCodes } = require("http-status-codes");

// blockchain status
const { getProjectStatus } = require("./blockchain");

// mongodb call
const collection = require("./config");
// web3 call
require("./blockchain");

const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cors
const corsOptions = {
  origin: `${process.env.APP_URL}`,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// app.use(express.static(path.join(__dirname, "login")));
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "login", "login.html"));
// });
// app.get("/signup", (req, res) => {
//   res.sendFile(path.join(__dirname, "login", "signup.html"));
// });

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await collection.findOne({ name: username });

    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        error: "User already exists. Please choose a different username.",
      });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = { name: username, password: hashedPassword };
    await collection.insertMany([newUser]);
    res.status(StatusCodes.CREATED).json({ id: newUser._id });
  } catch (error) {
    console.error("Signup error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occured during the signup process" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await collection.findOne({ name: username });

  if (!user) {
    res.send("User name cannot be found");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch) {
      req.session.username = username;
      // res.redirect("/profile?user=" + encodeURIComponent(req.session.username));
      res.status(StatusCodes.OK).json({ id: req.session.username });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Wrong Password" });
    }
  }
});

app.get("/profile", (req, res) => {
  if (req.session.username) {
    res.sendFile(path.join(__dirname, "profiles", "profile.html"));
  } else {
    res.redirect("/");
  }
});

app.get("/project/status", async (req, res) => {
  const result = await getProjectStatus();
  if (result) res.status(StatusCodes.OK).json({ result: result[0] });
  else
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ 
        error: "An error occured while fetchinng status from blockchain",
      });
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
