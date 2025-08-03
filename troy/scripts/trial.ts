import { ethers } from "ethers";
import IResolverExampleArtifact from "../artifacts/contracts/interfaces/IResolverExample.sol/IResolverExample.json";
import ResolverArtifact from "../artifacts/contracts/Resolver.sol/Resolver.json"
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const factory = new ethers.ContractFactory(
    ResolverArtifact.abi,
    ResolverArtifact.bytecode,
    signer
  );

  console.log("Deploying Resolver...");
  const resolver = await factory.deploy();

  console.log("Tx hash:", resolver.deploymentTransaction()?.hash);
  await resolver.waitForDeployment();

  const resolverAddress = await resolver.getAddress();
  console.log("Resolver deployed at:", resolverAddress);
}

main().catch((err) => {
  console.error("Error:", err);
});
