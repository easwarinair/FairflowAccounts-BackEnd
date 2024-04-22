const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const uri = `mongodb+srv://20br13587:${process.env.DB_PASSWORD}@fairflowaccounts.jgeu2kr.mongodb.net/?retryWrites=true&w=majority&appName=FairFlowAccounts`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const users = await client.db("fairflowAccounts").collection("users");

    console.log(await users.distinct("name"));
  } catch (e) {
    console.log(e);
  }
}
run().catch(console.dir);

// // Create Schema
// const Loginschema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// // collection part
// const collection = new mongoose.model("users", Loginschema);

// module.exports = collection;
