const { ethers, BaseContract } = require("ethers");
const path = require("path");
const dotenv = require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const fs = require("fs-extra");
const { sign } = require("crypto");

console.log("Started calling blockchain");
const abi = fs.readFileSync(
  path.join(__dirname, "FairFlowAccounts_sol_FairFlowAccounts.abi"),
  "utf-8"
);

// Connect to the Ethereum network
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Your contract's address and ABI
const contractAddress = process.env.CONTRACT_ADDRESS;

// Connect to the contract
const contract = new ethers.Contract(contractAddress, abi, provider);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

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
      title: status[0].toString(),
      currentPhase: status[1].toString(),
      phaseDescription: status[2].toString(),
      latestUpdate: status[3].toString(),
      balance: status[4].toString(),
      fundsReceived: status[5].toString(),
      fundsSpent: status[6].toString(),
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

function makeTransaction(signature, args, value, sender, receiver) {
  const transaction = {
    sign: signature,
    arg: args,
    val: value.toString(),
    sender: sender,
    receiver: receiver,
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

  const transactionDetails = await Promise.all(
    transactions.map((tx) => {
      // console.log(tempInterface);
      if (tx.hash == process.env.TX_HASH) {
        return makeTransaction(
          "contractCreated()",
          "contractData",
          tx.value.toString(),
          tx.from.toString(),
          process.env.CONTRACT_ADDRESS
        );
      } else {
        const tempInterface = interface.parseTransaction({ data: tx.data });
        if (tempInterface == null) {
          return makeTransaction(
            "sendEtherToContract()",
            tx.value.toString(),
            tx.value.toString(),
            tx.from.toString(),
            tx.to.toString()
          );
        } else {
          return makeTransaction(
            tempInterface.signature.toString(),
            tempInterface.args.toString(),
            tx.value.toString(),
            tx.from.toString(),
            tx.to.toString()
          );
        }
      }
    })
  );
  return transactionDetails;
}

getContractTransactions().then(() => {});

module.exports = {
  addManager,
  fundProject,
  updatePhase,
  completePhase,
  sendFunds,
  getProjectStatus,
  sendEtherToContract,
  getSigner,
  getContractTransactions,
};
