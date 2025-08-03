import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying LimitOrderProtocol from:", deployer.address);

  const IWETH_ADDRESS = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // WETH on Sepolia
  const LimitOrderProtocol = await ethers.getContractFactory("LimitOrderProtocol");
  const lop = await LimitOrderProtocol.deploy(IWETH_ADDRESS);
  await lop.waitForDeployment();

  console.log("LimitOrderProtocol deployed at:", await lop.getAddress());
}

main().catch(console.error);
