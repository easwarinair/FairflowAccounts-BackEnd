const { ethers, BaseContract, isAddress } = require("ethers");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const fs = require("fs-extra");
const { sign } = require("crypto");
const { time } = require("console");

console.log("Started calling blockchain");
const abi = fs.readFileSync(
  path.join(__dirname, "FairFlowAccounts_sol_FairFlowAccounts.abi"),
  "utf-8"
);

// Connect to the Ethereum network
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Your contract's address and ABI
var contractAddress = process.env.CONTRACT_ADDRESS;

// Connect to the contract
var contract = new ethers.Contract(contractAddress, abi, provider);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function checkAddress(address) {
  try {
    if (isAddress(address)) return address;
    else {
      const error = new Error("Invalid Address!");
      error.code = "INVALID_ADDRESS_ERROR";
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

async function connectToContract(address) {
  try {
    contractAddress = checkAddress(address);
  } catch (error) {
    console.log("An error has occured. Details are:", error);
  }
  contract = new ethers.Contract(contractAddress, abi, provider);
}

async function addManager(newManagerAddress) {
  const contractWithSigner = contract.connect(signer);
  const address = checkAddress(newManagerAddress);
  const tx = await contractWithSigner.addManager(address);
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function removeManager(newManagerAddress) {
  const contractWithSigner = contract.connect(signer);
  const address = checkAddress(newManagerAddress);
  const tx = await contractWithSigner.addManager(address);
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function fundProject(value) {
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.fundProject({
    value: ethers.parseEther(value.toString()),
  });
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function updatePhase(updates) {
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.updatePhase(updates);
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function completePhase() {
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.completePhase();
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function sendFunds(toAddress, amount, purpose) {
  const contractWithSigner = contract.connect(signer);
  const address = checkAddress(toAddress);
  const tx = await contractWithSigner.sendFunds(
    address,
    ethers.parseEther(amount.toString()),
    purpose
  );
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function getProjectStatus() {
  const status = await contract.getProjectStatus();
  if (status) {
    const projectStatus = {
      title: status[0].toString(),
      projectDescription: status[1].toString(),
      currentPhase: status[2].toString(),
      phaseDescription: status[3].toString(),
      latestUpdate: status[4].toString(),
      balance: status[5].toString(),
      fundsReceived: status[6].toString(),
      fundsSpent: status[7].toString(),
    };
    return projectStatus;
  } else return null;
}

async function sendEtherToContract(value) {
  const tx = await signer.sendTransaction({
    to: contractAddress,
    value: ethers.parseEther(value.toString()),
  });
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function getSigner() {
  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
}

function makeTransaction(signature, args, value, sender, receiver, timestamp) {
  const transaction = {
    sign: signature,
    arg: args,
    val: value.toString(),
    sender: sender,
    receiver: receiver,
    timestamp: timestamp,
  };
  return transaction;
}

async function getContractTransactions() {
  const logs = await provider.getLogs({
    fromBlock: 0,
    toBlock: "latest",
    address: contractAddress,
  });

  const interface = ethers.Interface.from(abi);

  const transactions = await Promise.all(
    logs.map(async (log) => await provider.getTransaction(log.transactionHash))
  );
  const transactionReceipts = await Promise.all(
    transactions.map(async (tx) => await tx.wait(1))
  );
  const blocks = await Promise.all(
    transactionReceipts.map(async (tr) => await tr.getBlock())
  );
  const unixTimestamps = await Promise.all(
    blocks.map(async (block) => await block.timestamp)
  );
  const timestamps = unixTimestamps.map((timestamp) => {
    const dateTime = new Date(timestamp * 1000);
    return dateTime;
  });

  const transactionDetails = await Promise.all(
    transactions.map((tx, i) => {
      // console.log(timestamps[i].toUTCString());
      if (tx.hash == process.env.TX_HASH) {
        return makeTransaction(
          "contractCreated()",
          "",
          tx.value.toString(),
          tx.from.toString(),
          process.env.CONTRACT_ADDRESS,
          timestamps[i].toUTCString()
        );
      } else {
        const tempInterface = interface.parseTransaction({ data: tx.data });
        if (tempInterface == null) {
          return makeTransaction(
            "sendEtherToContract()",
            tx.value.toString(),
            tx.value.toString(),
            tx.from.toString(),
            tx.to.toString(),
            timestamps[i].toUTCString()
          );
        } else {
          return makeTransaction(
            tempInterface.signature.toString(),
            tempInterface.args.toString(),
            tx.value.toString(),
            tx.from.toString(),
            tx.to.toString(),
            timestamps[i].toUTCString()
          );
        }
      }
    })
  );
  return transactionDetails;
}

async function run() {
  console.log(await getContractTransactions());
}
run();

module.exports = {
  addManager,
  removeManager,
  fundProject,
  updatePhase,
  completePhase,
  sendFunds,
  getProjectStatus,
  sendEtherToContract,
  getSigner,
  getContractTransactions,
  connectToContract,
};
