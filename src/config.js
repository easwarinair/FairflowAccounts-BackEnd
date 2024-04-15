const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb://localhost:27017/fairflowAccounts");

connect.then(() => {
    console.log("Database Connected Successfully");
}).catch((err) => {
    console.log("Database cannot be Connected", err);
});

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;