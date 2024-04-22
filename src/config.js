const { MongoClient, ServerApiVersion } = require("mongodb");
const mongoose = require("mongoose");
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
  } catch (e) {
    console.log(e);
  }
}
run().catch(console.dir);

// collection part
const collection = client.db("fairflowAccounts").collection("users");

module.exports = collection;
