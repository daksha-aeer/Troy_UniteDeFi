import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { buildOrder } from "../helpers/orderUtils.js";
import fs from 'fs';
import IERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";

async function main() {
  const [maker] = await ethers.getSigners();
  const usdc = await ethers.getContractAt(IERC20ABI.abi, '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');

  const startPrice = parseUnits('0.1', 18);   // max price (user input)
  const endPrice = parseUnits('0.05', 18);    // min price (user input)
  const duration = 86400n;                    // 1 day (user input)

  const ts = BigInt(Math.floor(Date.now() / 1000));
  const startEndTs = (ts << 128n) | (ts + duration);

  const DutchAuctionCalculator = await ethers.getContractFactory('DutchAuctionCalculator');
  const dac = await DutchAuctionCalculator.deploy();
  await dac.waitForDeployment();

  const auctionData = ethers.solidityPacked(
    ['address', 'uint256', 'uint256', 'uint256'],
    [await dac.getAddress(), startEndTs, startPrice, endPrice]
  );

  const order = buildOrder(
    {
      makerAsset: await usdc.getAddress(),
      takerAsset: await usdc.getAddress(),
      makingAmount: parseUnits('100', 6),
      takingAmount: startPrice,
      maker: maker.address,
    },
    {
      makingAmountData: auctionData,
      takingAmountData: auctionData,
    }
  );

  fs.writeFileSync(
    'order.json',
    JSON.stringify({
      order,
      auctionData,
      startEndTs: startEndTs.toString(),
      startPrice: startPrice.toString(),
      endPrice: endPrice.toString(),
      auctionContract: await dac.getAddress()
    }, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
  );
  

  console.log("✅ Order saved to order.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
