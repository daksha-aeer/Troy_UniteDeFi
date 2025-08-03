import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockERC20 from:", deployer.address);

  const Token = await ethers.getContractFactory("MockERC20");
  const token = await Token.deploy();
  await token.waitForDeployment();

  console.log("MockERC20 deployed at:", await token.getAddress());
}

main().catch(console.error);
