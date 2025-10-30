import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SplitFactory contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy SplitFactory
  const SplitFactory = await ethers.getContractFactory("SplitFactory");
  const splitFactory = await SplitFactory.deploy();
  await splitFactory.waitForDeployment();

  const factoryAddress = await splitFactory.getAddress();
  console.log("SplitFactory deployed to:", factoryAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await splitFactory.deploymentTransaction()?.wait(5);

  console.log("\n✅ Deployment complete!");
  console.log("\nContract addresses:");
  console.log("-------------------");
  console.log("SplitFactory:", factoryAddress);
  console.log("\nTo verify on BaseScan, run:");
  console.log(`npx hardhat verify --network <network-name> ${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

