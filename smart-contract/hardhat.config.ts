import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28", // Slightly adjusted for stable compatibility
  networks: {
    // 1. Localhost (Standard Config)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // 2. Sepolia (Standard Config)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};

export default config;