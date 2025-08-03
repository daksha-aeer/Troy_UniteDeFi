import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: { viaIR: true, optimizer: { enabled: true, runs: 200 } },
      },
      {
        version: "0.8.28",
        settings: { viaIR: true, optimizer: { enabled: true, runs: 200 } },
      },
    ],
  },

  networks: {
    sepolia: {
      url: process.env.ALCHEMY_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  }
};

export default config;
