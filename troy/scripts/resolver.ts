// resolver.ts
import axios from "axios";
import { ethers } from "ethers";
import IResolverExampleArtifact from "../artifacts/contracts/interfaces/IResolverExample.sol/IResolverExample.json";
import { buildOrder } from "../helpers/orderUtils.js";


interface Auction {
  orderId: string;
  order: any;
  auctionData: string;
  startPrice: string;
  endPrice: string;
  startEndTs: string;
  timestamp: number;
  status: 'active' | 'filled' | 'expired';
}

class AuctionResolver {
  private serverUrl: string;
  private processedAuctions: Set<string> = new Set();
  private isRunning: boolean = false;

  constructor(serverUrl: string = 'http://localhost:4000') {
    this.serverUrl = serverUrl;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Resolver already running');
      return;
    }

    this.isRunning = true;
    console.log('Resolver starting...');
    
    // Wait for server to be ready
    await this.waitForServer();
    
    // Start checking auctions
    this.startAuctionMonitoring();
  }

  private async waitForServer(maxRetries: number = 10): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await axios.get(`${this.serverUrl}/health`, { 
          timeout: 2000,
          headers: { Connection: 'close' } 
        });
        console.log('Server is ready');
        return;
      } catch (err) {
        console.log(`⏳ Waiting for server... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Server not available after maximum retries');
  }

  private startAuctionMonitoring() {
    const checkInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(checkInterval);
        return;
      }
      
      await this.checkAuctions();
    }, 5000); // Check every 5 seconds

    console.log('Auction monitoring started (checking every 5s)');
  }

  private async checkAuctions() {
    try {
      const response = await axios.get(`${this.serverUrl}/auctions`, { 
        timeout: 5000,
        headers: { Connection: 'close' } 
      });
      
      const auctions: Auction[] = response.data;
      
      if (auctions.length === 0) {
        console.log('No active auctions found');
        return;
      }

      console.log(`Found ${auctions.length} auction(s)`);
      
      for (const auction of auctions) {
        await this.processAuction(auction);
      }
      
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') {
        console.error("Cannot connect to auction server");
      } else if (err.code === 'ECONNRESET') {
        console.error("Connection reset by server");
      } else {
        console.error("Resolver failed to fetch auctions:", err.message);
      }
    }
  }

  private async processAuction(auction: Auction) {
    // Skip if already processed
    if (this.processedAuctions.has(auction.orderId)) {
      return;
    }

    this.processedAuctions.add(auction.orderId);
    
    console.log(`\n Processing auction ${auction.orderId}:`);
    console.log(`Start Price: ${this.formatPrice(auction.startPrice)} USDC`);
    console.log(`End Price: ${this.formatPrice(auction.endPrice)} USDC`);
    
    // Get current price
    try {
      const currentPrice = await this.getCurrentPrice(auction);
      console.log(`   Current Price: ${this.formatPrice(currentPrice.toString())} USDC`);
      
      
      
    } catch (error: any) {
      console.error(`Error processing auction: ${error.message}`);
    }
  }

  private formatPrice(priceStr: string): string {
    try {
      return ethers.formatUnits(priceStr, 18);
    } catch {
      // Fallback formatting if ethers fails
      const price = BigInt(priceStr);
      const divisor = BigInt('1000000000000000000'); // 10^18
      const whole = price / divisor;
      const remainder = price % divisor;
      return `${whole}.${remainder.toString().padStart(18, '0').slice(0, 6)}`;
    }
  }

  private async getCurrentPrice(auction: Auction): Promise<bigint> {
    try {
      // Parse the auction timing data
      const startEndTs = BigInt(auction.startEndTs);
      const startTs = startEndTs >> 128n;
      const endTs = startEndTs & ((1n << 128n) - 1n);
      
      const currentTs = BigInt(Math.floor(Date.now() / 1000));
      const startPrice = BigInt(auction.startPrice);
      const endPrice = BigInt(auction.endPrice);
      
      // Calculate current price based on linear interpolation
      if (currentTs <= startTs) {
        return startPrice;
      } else if (currentTs >= endTs) {
        return endPrice;
      } else {
        const elapsed = currentTs - startTs;
        const duration = endTs - startTs;
        const priceReduction = (startPrice - endPrice) * elapsed / duration;
        return startPrice - priceReduction;
      }
    } catch (error) {
      console.error('Error calculating current price:', error);
      return BigInt(auction.startPrice);
    }
  }

  private async shouldBidOnAuction(auction: Auction, currentPrice: bigint): Promise<boolean> {
    // Simple strategy: bid when price drops to 80% of start price
    const startPrice = BigInt(auction.startPrice);
    const targetPrice = (startPrice * 80n) / 100n;
    
    return currentPrice <= targetPrice;
  }

  private async submitBid(auction: Auction, price: bigint) {
    console.log(`Submitting bid for ${this.formatPrice(price.toString())} USDC`);
    
    // TODO: Implement actual bid submission logic
    // This would involve:
    // 1. Create the fill transaction
    // 2. Sign and submit to the network
    // 3. Update auction status
    
    console.log(`Bid submitted (placeholder)`);
  }

  stop() {
    console.log('Stopping resolver...');
    this.isRunning = false;
  }
}

// Main execution
async function main() {
  const resolver = new AuctionResolver();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n Received SIGINT, shutting down');
    resolver.stop();
    process.exit(0);
  });

  try {
    await resolver.start();
  } catch (error: any) {
    console.error('Failed to start resolver:', error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Resolver crashed:', err);
    process.exit(1);
  });
}