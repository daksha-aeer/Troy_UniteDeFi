// order.ts
import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { buildOrder } from "../helpers/orderUtils.js";
import fs from 'fs';
import IERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import axios from 'axios';

async function main() {
  const [maker] = await ethers.getSigners();
  console.log(`📝 Maker address: ${maker.address}`);
  
  // Get USDC contract
  const usdc = await ethers.getContractAt(IERC20ABI.abi, '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');

  // Auction parameters
  const startPrice = parseUnits('0.1', 18);   // 0.1 USDC per token (max price)
  const endPrice = parseUnits('0.05', 18);    // 0.05 USDC per token (min price)
  const duration = 120n;                    // 1 day duration

  console.log(`⚡ Auction parameters:`);
  console.log(`   Start Price: ${ethers.formatUnits(startPrice, 18)} USDC`);
  console.log(`   End Price: ${ethers.formatUnits(endPrice, 18)} USDC`);
  console.log(`   Duration: ${duration} seconds (${Number(duration) / 3600} hours)`);

  // Create timestamp data
  const ts = BigInt(Math.floor(Date.now() / 1000));
  const startEndTs = (ts << 128n) | (ts + duration);
  
  console.log(`⏰ Timing:`);
  console.log(`   Start: ${new Date(Number(ts) * 1000).toISOString()}`);
  console.log(`   End: ${new Date(Number(ts + duration) * 1000).toISOString()}`);

  // Deploy Dutch Auction Calculator
  console.log('📋 Deploying DutchAuctionCalculator...');
  const DutchAuctionCalculator = await ethers.getContractFactory('DutchAuctionCalculator');
  const dac = await DutchAuctionCalculator.deploy();
  await dac.waitForDeployment();
  
  const dacAddress = await dac.getAddress();
  console.log(`✅ DutchAuctionCalculator deployed at: ${dacAddress}`);

  // Create auction data
  const auctionData = ethers.solidityPacked(
    ['address', 'uint256', 'uint256', 'uint256'],
    [dacAddress, startEndTs, startPrice, endPrice]
  );

  // Build the order
  const order = buildOrder(
    {
      makerAsset: await usdc.getAddress(),
      takerAsset: await usdc.getAddress(),
      makingAmount: parseUnits('100', 6), // 100 USDC worth of tokens
      takingAmount: startPrice,
      maker: maker.address,
    },
    {
      makingAmountData: auctionData,
      takingAmountData: auctionData,
    }
  );

  // Save order to file
  const orderData = {
    order,
    auctionData,
    startEndTs: startEndTs.toString(),
    startPrice: startPrice.toString(),
    endPrice: endPrice.toString(),
    auctionContract: dacAddress,
    timestamp: Date.now(),
    duration: duration.toString()
  };

  fs.writeFileSync(
    'order.json',
    JSON.stringify(orderData, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2)
  );

  const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Broadcast to auction server
  try {
    console.log('Broadcasting auction');
    
    // Helper function to convert BigInt to string recursively
    function serializeBigInt(obj: any): any {
      if (typeof obj === 'bigint') {
        return obj.toString();
      } else if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
      } else if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = serializeBigInt(value);
        }
        return result;
      }
      return obj;
    }
    
    const broadcastData = {
      orderId,
      order: serializeBigInt(order),
      auctionData,
      startPrice: startPrice.toString(),
      endPrice: endPrice.toString(),
      startEndTs: startEndTs.toString(),
      makerAddress: maker.address,
      auctionContract: dacAddress
    };

    const response = await axios.post("http://localhost:4000/broadcast", broadcastData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close'
      }
    });

    if (response.data.success) {
      console.log(`Order ID: ${orderId}`);
      console.log(`Check auctions at: http://localhost:4000/auctions`);
      console.log(`Check specific auction: http://localhost:4000/auction/${orderId}`);
    } else {
      console.error("❌ Broadcast failed:", response.data);
    }

  } catch (error: any) {
    console.error("❌ Failed to broadcast auction:");
    
    if (error.code === 'ECONNREFUSED') {
      console.error("   Server is not running. Please start the auction server first:");
      console.error("   npm run server  # or node broadcastAuction.js");
    } else if (error.response) {
      console.error(`   HTTP ${error.response.status}: ${error.response.statusText}`);
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.log("⚠️ Order created locally but not broadcast to resolvers");
  }

}

main().catch((err) => {
  console.error('Order creation failed:', err);
  process.exit(1);
});