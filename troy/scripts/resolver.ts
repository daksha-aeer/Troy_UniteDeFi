// resolver.ts
import axios from "axios";

async function checkAuctions() {
  try {
    const { data } = await axios.get("http://localhost:4000/auctions");
    data.forEach((auction: any) => {
      console.log("🟢 Resolver sees auction:", auction.orderId, "Price range:", auction.startPrice, "→", auction.endPrice);
      // TODO: Add bidding logic here
    });
  } catch (err) {
    console.error("❌ Resolver failed to fetch auctions", err);
  }
}

setInterval(checkAuctions, 5000); // check every 5s
