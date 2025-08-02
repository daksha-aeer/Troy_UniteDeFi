// broadcastAuction.ts
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(bodyParser.json());
app.use(cors());

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

let auctions: Auction[] = [];

app.post('/broadcast', (req, res) => {
  try {
    const auction: Auction = {
      ...req.body,
      timestamp: Date.now(),
      status: 'active'
    };
    
    auctions.push(auction);
    console.log(`New auction broadcast: ${auction.orderId}`);
    console.log(`Start Price: ${auction.startPrice}`);
    console.log(`End Price: ${auction.endPrice}`);
    console.log(`Total auctions: ${auctions.length}`);
    
    res.json({ success: true, auctionId: auction.orderId });
  } catch (error) {
    console.error('Error broadcasting auction:', error);
    res.status(500).json({ success: false, error: 'Failed to broadcast auction' });
  }
});

app.get('/auctions', (_req, res) => {
  try {
    // Filter out expired auctions (older than 24 hours)
    const activeAuctions = auctions.filter(auction => {
      const auctionAge = Date.now() - auction.timestamp;
      return auctionAge < 24 * 60 * 60 * 1000; // 24 hours
    });
    
    res.json(activeAuctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

app.get('/auction/:orderId', (req, res) => {
  try {
    const auction = auctions.find(a => a.orderId === req.params.orderId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    res.json(auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ error: 'Failed to fetch auction' });
  }
});

app.delete('/auction/:orderId', (req, res) => {
  try {
    const index = auctions.findIndex(a => a.orderId === req.params.orderId);
    if (index === -1) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    
    auctions.splice(index, 1);
    console.log(`🗑️ Removed auction: ${req.params.orderId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing auction:', error);
    res.status(500).json({ error: 'Failed to remove auction' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', auctions: auctions.length });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Auction server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});