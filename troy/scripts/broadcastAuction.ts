import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

let auctions: any[] = [];

app.post('/broadcast', (req, res) => {
  auctions.push(req.body);
  console.log("📢 New auction broadcast:", req.body);
  res.sendStatus(200);
});

app.get('/auctions', (_req, res) => {
  res.json(auctions);
});

app.listen(4000, () => console.log("🚀 Auction server running on http://localhost:4000"));
