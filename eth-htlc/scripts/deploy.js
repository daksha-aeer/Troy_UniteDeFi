const hre = require("hardhat");

async function main() {
  // Get the contract to deploy
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");

  // Deploy it with an initial message
  const hello = await HelloWorld.deploy("Hello from Hardhat!");

  // Wait until deployment is done
  await hello.waitForDeployment();

  console.log("HelloWorld deployed to:", hello.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
