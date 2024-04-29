const { ethers, BaseContract } = require("ethers");
const path = require("path");
const fs = require("fs-extra");
const envPath = path.join(__dirname, "..", "..", ".env");
const dotenv = require("dotenv").config({
  path: envPath,
});

function writeHashToEnv(hash) {
  fs.readFile(envPath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read .env file:", err);
      return;
    }

    // Convert .env file content into an array of lines
    const lines = data.split(/\r?\n/);

    // Check if TX_HASH already exists
    const txHashIndex = lines.findIndex((line) => line.startsWith("TX_HASH="));

    if (txHashIndex !== -1) {
      // Replace the existing TX_HASH
      lines[txHashIndex] = `TX_HASH=${hash}`;
    } else {
      // Append new TX_HASH
      lines.push(`TX_HASH=${hash}`);
    }

    // Convert the lines back into a single string
    const updatedContents = lines.join("\n");

    // Write the updated contents back to the .env file
    fs.writeFile(envPath, updatedContents, "utf8", (err) => {
      if (err) {
        console.error("Failed to write to .env file:", err);
      } else {
        console.log("Updated .env file with TX_HASH");
      }
    });
  });
}
function writeCAToEnv(hash) {
  fs.readFile(envPath, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read .env file:", err);
      return;
    }

    // Convert .env file content into an array of lines
    const lines = data.split(/\r?\n/);

    // Check if TX_HASH already exists
    const txHashIndex = lines.findIndex((line) =>
      line.startsWith("CONTRACT_ADDRESS=")
    );

    if (txHashIndex !== -1) {
      // Replace the existing TX_HASH
      lines[txHashIndex] = `CONTRACT_ADDRESS=${hash}`;
    } else {
      // Append new TX_HASH
      lines.push(`CONtRACT_ADDRESS=${hash}`);
    }

    // Convert the lines back into a single string
    const updatedContents = lines.join("\n");

    // Write the updated contents back to the .env file
    fs.writeFile(envPath, updatedContents, "utf8", (err) => {
      if (err) {
        console.error("Failed to write to .env file:", err);
      } else {
        console.log("Updated .env file with CONTRACT_ADDRESS");
      }
    });
  });
}

async function deployContract(
  projectTitle,
  projectDescription,
  fundsRequired,
  projectPhases
) {
  const url = process.env.RPC_URL;
  const provider = new ethers.JsonRpcProvider(url);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const ffPath = path.join(__dirname);
  const abi = fs.readFileSync(
    path.join(ffPath, "/FairFlowAccounts_sol_FairFlowAccounts.abi"),
    "utf-8"
  );
  const bin = fs.readFileSync(
    path.join(ffPath, "/FairFlowAccounts_sol_FairFlowAccounts.bin"),
    "utf-8"
  );

  const contractFactory = new ethers.ContractFactory(abi, bin, wallet);
  const contract = await contractFactory.deploy(
    projectTitle,
    projectDescription,
    fundsRequired,
    projectPhases
  );
  console.log("Deploying contract...");
  const response = await contract.waitForDeployment();
  const tx = await contract.deploymentTransaction();
  const txRec = await contract.deploymentTransaction().wait(1);
  return { hash: tx.hash, contractAddress: txRec.contractAddress };
  // writeHashToEnv(tx.hash);
  // writeCAToEnv(txRec.contractAddress);
}

deployContract();
