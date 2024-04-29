const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const root_dir = __dirname.split("src")[0];
dotenv.config({ path: path.join(root_dir, `.env`) });
const { StatusCodes } = require("http-status-codes");
const { removeBigInts } = require("./src/utils/removeBigInt");
const { attachCookie, clearCookie } = require("./src/utils/auth.utils");
const ObjectId = require("mongodb").ObjectId;

// blockchain status
const {
  getProjectStatus,
  getContractTransactions,
  connectToContract,
  fundProject,
} = require("./src/blockchain/blockchain");
const verifyToken = require("./src/middleware/verifyToken");

// mongodb call
const { collection, projectCollection } = require("./src/config");
// web3 call
require("./src/blockchain/blockchain");

const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const morgan = require("morgan");
const { createJwt } = require("./src/utils/jwt.utils");

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
    const t = createJwt(
      {
        id: user._id,
      },
      process.env.TOKEN_EXPIRE,
      process.env.TOKEN_SECRET
    );
    attachCookie(t, res, "token");
    res.status(StatusCodes.OK).json({ id: user._id });
  } else {
    res.status(StatusCodes.BAD_REQUEST).json({ error: "Incorrect password." });
  }
});

app.get("/user", verifyToken, async (req, res) => {
  const { id } = req.user;
  const user = await collection.findOne({ _id: new ObjectId(id) });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).send("User not found.");
  }
  res
    .status(StatusCodes.OK)
    .json({ id: user._id, email: user.email, authLevel: user.authLevel });
});

app.get("/logout", verifyToken, async (req, res) => {
  clearCookie(res, "token");
  res.status(StatusCodes.OK).json({ message: "User logged out successfully!" });
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

app.post("/transact/fund", async (req, res) => {
  try {
    const { value, signer } = req.body;
    const fund = await fundProject(value, signer);
    if (fund) {
      return res.status(StatusCodes.OK).json({ hash: fund });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).send("Transaction failed!");
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
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
