const { ethers, BaseContract } = require("ethers");
const path = require("path");
const fs = require("fs-extra");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
async function main() {
  const url = process.env.RPC_URL;
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const abi = fs.readFileSync(
    "./FairFlowAccounts_sol_FairFlowAccounts.abi",
    "utf-8"
  );
  const bin = fs.readFileSync(
    "./FairFlowAccounts_sol_FairFlowAccounts.bin",
    "utf-8"
  );

  const contractFactory = new ethers.ContractFactory(abi, bin, wallet);
  const contract = await contractFactory.deploy(
    "RIT Lecture Block Construction",
    "This project tracks the progress of the lecture block construction at RIT, Kottayam.",
    "40000000000000000000",
    [
      "Design",
      "Foundation",
      "Structure",
      "Plastering",
      "Electricity and Plumbing",
      "Painting",
    ]
  );
  console.log("Deploying contract...");
  const response = await contract.waitForDeployment();
}

main();
