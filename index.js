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
  connectToContract,
} = require("./src/blockchain/blockchain");

// mongodb call
const { collection, projectCollection } = require("./src/config");
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
  origin: [
    "https://fair-flow-accounts-front-end.vercel.app",
    "http://localhost:3000",
  ], // List of allowed origins
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

// async function test(id) {
//   await connectToContract(id);
//   const projectStatus = await getProjectStatus();
//   const transactions = await getContractTransactions();
//   var res = {};
//   res = { status: projectStatus, tx: transactions };
//   console.log(res);
// }

// test("0x6971A6F7b7CBA9a5cFeCa8dC0df40A1E08ea9f28");

app.get("/api", (req, res) => {
  res.status(200).json({ message: `Api alive at ${port}` });
});

app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
      return res.status(StatusCodes.CONFLICT).json({
        error:
          "User already exists with this email. Please use a different email.",
      });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = {
      name: username,
      email: email,
      password: hashedPassword,
      authLevel: 0,
    };
    await collection.insertOne(newUser);
    res.status(StatusCodes.CREATED).json({ id: newUser._id });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred during the signup process.",
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await collection.findOne({ email: email });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).send("Email not found.");
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (isPasswordMatch) {
    req.session.user = user.email; // Store email in session
    res.status(StatusCodes.OK).json({ id: user._id });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Incorrect password." });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const documents = await projectCollection.find().toArray();
    if (documents) {
      res.status(StatusCodes.OK).send(documents);
    }
  } catch (error) {
    console.log("An error has occured, details are:", error);
  }
});

app.get("/projects/:id/:hash", async (req, res) => {
  try {
    const id = req.params.id;
    const hash = req.params.hash;
    await connectToContract(id);
    const projectStatus = await getProjectStatus();
    console.log(projectStatus);
    const transactions = await getContractTransactions(hash);
    console.log(transactions);
    const blockCount = transactions.length;
    if (projectStatus && transactions) {
      res.status(StatusCodes.OK).json({
        projectDetails: projectStatus,
        transactions: transactions,
        blockCount: blockCount,
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "An error occured while fetching project", data: error });
  }
});

app.get("/project/status", async (req, res) => {
  try {
    const result = await getProjectStatus();
    const txs = await getContractTransactions();
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
