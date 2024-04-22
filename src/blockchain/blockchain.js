const { ethers, BaseContract } = require("ethers");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const fs = require("fs-extra");

console.log("Started calling blockchain");
const abi = fs.readFileSync(
  "FairFlowAccounts_sol_FairFlowAccounts.abi",
  "utf-8"
);

// Connect to the Ethereum network
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Your contract's address and ABI
const contractAddress = process.env.CONTRACT_ADDRESS;

// Connect to the contract
const contract = new ethers.Contract(contractAddress, abi, provider);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// console.log(contract)

// const contractWithSigner = contract.connect(signer);
// const response = await contractWithSigner.updatePhase(
//   "Materials for foundation unloaded"
// );
// console.log(response);
// const status = await contract.getProjectStatus();
// console.log(`contract connected... Contract details: ${status}`);

async function addManager(newManagerAddress) {
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.addManager(newManagerAddress);
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
  const tx = await contractWithSigner.sendFunds(
    toAddress,
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
      title: status[0],
      currentPhase: status[1].toString(),
      phaseDescription: status[2],
      latestUpdate: status[3],
      fundsReceived: status[4].toString(),
      fundsSpent: status[5].toString(),
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

  const transactionDetails = await Promise.all(
    transactions.map((tx) => {
      return interface.parseTransaction({ data: tx.data });
    })
  );
  return transactionDetails;
}

// addManager("0x587ef81fe78b2126843fd0df8078ef6a4586c0f4").then(() => {});
// fundProject(0.1).then(() => {
//   console.log("Project funded with 0.1 eth");
// });
// updatePhase("0.1Eth added")
//   .then(() => {
//     console.log("latest update added");
//   });

// completePhase()
//   .then(() => {
//     console.log("Phase completed");
//   });
// sendFunds("0x587ef81fe78b2126843fd0df8078ef6a4586c0f4", 0.1, "Reimbursement")
//   .then(() => {
//     console.log("money back guarantee");
//   });
// getProjectStatus().then((value) => {
//   console.log(value);
// });

getContractTransactions().then((transactions) => {
  console.log("Transactions: ", transactions);
});

module.exports = {
  addManager,
  fundProject,
  updatePhase,
  completePhase,
  sendFunds,
  getProjectStatus,
  sendEtherToContract,
  getSigner,
};
