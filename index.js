const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const root_dir = __dirname.split("src")[0];
dotenv.config({ path: path.join(root_dir, `.env`) });
const { StatusCodes } = require("http-status-codes");
const { removeBigInts } = require("./src/utils/removeBigInt");

// blockchain status
const {
  getProjectStatus,
  getContractTransactions,
} = require("./src/blockchain/blockchain");

// mongodb call
const collection = require("./src/config");
// web3 call
require("./src/blockchain/blockchain");

const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const morgan = require("morgan");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("tiny"));
const corsOptions = {
  origin: "https://fair-flow-accounts-front-end.vercel.app", // This is the frontend origin
  optionsSuccessStatus: 200,
  credentials: true, // This is needed if your front-end needs to send credentials like cookies or authentication headers.
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"],
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

app.get("/api", (req, res) => {
  res.status(200).json({ message: `Api alive at ${port}` });
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
    console.log(`Data received: ${result}`);
    // const temp = removeBigInts(result);
    const txs = await getContractTransactions();
    console.log("Got transactions", txs);
    const blockCount = txs.length;

    if (result)
      res
        .status(StatusCodes.OK)
        .json({ result: result, blockCount: blockCount, transactions: txs });
    else
      res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        error: "An error occured while fetching status from blockchain",
      });
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occured while fetching status from blockchain",
    });
  }
});
const port = 6969;
const tryListen = (port) => {
  app
    .listen(port, () => {
      console.log(`Server listening on port ${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        // Port is already in use, select a random port excluding commonly used ports
        const excludedPorts = [80, 443, 8080]; // Add more ports to exclude if needed
        let newPort;
        do {
          newPort = Math.floor(Math.random() * 65536); // Random port between 0 and 65535
        } while (excludedPorts.includes(newPort));
        tryListen(newPort); // Try listening on the new port
      } else {
        // Some other error occurred, log it
        console.error(err);
      }
    });
};

tryListen(port); // Start by trying port 6969
