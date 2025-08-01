import { ethers } from "hardhat";
import { parseUnits, AbiCoder, ZeroAddress } from "ethers";

const HASH_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000";


type Order = {
  maker: string;
  taker: string;
  makingAmount: bigint;
  takingAmount: bigint;
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);

  const DutchAuctionCalculator = await ethers.getContractFactory("DutchAuctionCalculator");
  const dac = await DutchAuctionCalculator.deploy();

  await dac.waitForDeployment();  // ✅ replaces .deployed()
  console.log(`DutchAuctionCalculator deployed at: ${dac.target}`); // ✅ use .target

  const order: Order = {
    maker: deployer.address,
    taker: ZeroAddress,
    makingAmount: parseUnits("100", 18),
    takingAmount: parseUnits("0.1", 18),
  };

  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + 60 * 10;

  // ✅ use BigInt directly for shifts
  const startTimeEndTime = (BigInt(startTime) << 128n) | BigInt(endTime);

  const extraData = AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256"],
    [startTimeEndTime, parseUnits("0.1", 18), parseUnits("0.05", 18)]
  );

  const takingAmount = await dac.getTakingAmount(
    order as any,
    "0x",
    HASH_ZERO,
    deployer.address,
    order.makingAmount,
    order.makingAmount,
    extraData
  );

  console.log(`Auction result: takingAmount = ${ethers.formatUnits(takingAmount, 18)} WETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
