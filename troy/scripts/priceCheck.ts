import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import fs from 'fs';

async function main() {
  const [taker] = await ethers.getSigners();

  const orderData = JSON.parse(fs.readFileSync('order.json', 'utf-8'));
  const order = orderData.order;
  const auctionContract = await ethers.getContractAt('DutchAuctionCalculator', orderData.auctionContract);

  const extraData = "0x" + orderData.auctionData.slice(42);

  const takingAmount = await auctionContract.getTakingAmount(
    order,
    '0x',
    ethers.ZeroHash,
    taker.address,
    order.makingAmount,
    order.makingAmount,
    extraData
  );

  console.log(`🟢 Current price for the taker: ${ethers.formatUnits(takingAmount, 18)} USDC`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
