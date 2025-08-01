import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: "0.8.28",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
    ],
  },

  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/do3MioPd73DuZvve_KLIc",
      accounts: [process.env.PRIVATE_KEY!],
    },
  }
};

export default config;
