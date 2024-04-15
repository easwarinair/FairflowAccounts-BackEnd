const { ethers, BaseContract } = require("ethers");
const fs = require("fs-extra");
console.log("Started calling blockchain");

const abi = fs.readFileSync(
  "./FairFlowAccounts_sol_FairFlowAccounts.abi",
  "utf-8"
);

// Connect to the Ethereum network
const provider = new ethers.JsonRpcProvider(
  "https://eth-sepolia.g.alchemy.com/v2/tI9SnWr_M3O3wH_d80a1Jvnq-PSTffcn"
);

// Your contract's address and ABI
const contractAddress = "0x1EAF924113313ACedCa20B4dA9Ed660Fe557D087";

// Connect to the contract
const contract = new ethers.Contract(contractAddress, abi, provider);
const signer = new ethers.Wallet(
  "e213efeac1ac677e12a2fed41808636cf5e5bc95954434e0451069ff2f9dfac8",
  provider
);
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
    value: ethers.utils.parseEther(value.toString()),
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
    ethers.utils.parseEther(amount.toString()),
    purpose
  );
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function getProjectStatus() {
  const status = await contract.getProjectStatus();
  if (status) return status;
  else return null;
}

async function sendEtherToContract(value) {
  const tx = await signer.sendTransaction({
    to: contractAddress,
    value: ethers.utils.parseEther(value.toString()),
  });
  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
}

async function getSigner() {
  await ethereum.request({ method: "eth_requestAccounts" });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  return provider.getSigner();
}

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
