const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const root_dir = __dirname.split("src")[0];
dotenv.config({ path: path.join(root_dir, `.env`) });
const { StatusCodes } = require("http-status-codes");
const { removeBigInts } = require("./utils/removeBigInt");

// blockchain status
const {getProjectStatus} = require("./blockchain/blockchain")

// mongodb call
const collection = require("./config");
// web3 call
require("./blockchain/blockchain");

const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const morgan = require("morgan");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// cors
const corsOptions = {
  origin: 'http://localhost:3000', 
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(morgan("tiny"));

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


app.get("/api", (req, res) => {
  res.status(200).json({ message: "Api alive at 5000" });
});

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await collection.findOne({ name: username });

    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        error: "User already exists. Please choose a different username.",
      });
    }

    // hashing password
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
      res.status(StatusCodes.OK).json({ id: req.session.username });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Wrong Password" });
    }
  }
});

app.get("/project/status", async (req, res) => {
  try {
    const result = await getProjectStatus();
    const temp = removeBigInts(result);
    const blockCount = 4;
   
    if (result) res.status(StatusCodes.OK).json({ result: temp , blockCount: blockCount  });
    else
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        error: "An error occured while fetching status from blockchain",
      });
  } catch (err) {
    console.err(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occured while fetching status from blockchain",
    });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});