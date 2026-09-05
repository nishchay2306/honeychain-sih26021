require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { AMOY_RPC_URL, PRIVATE_KEY, POLYGONSCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {}, // local in-memory network, used for tests
    amoy: {
      // Polygon's current public testnet (Mumbai was deprecated).
      // Get a free RPC URL from Alchemy or Infura, and test MATIC from
      // https://faucet.polygon.technology/
      url: AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
  etherscan: {
    // Polygonscan now uses the same Etherscan v2 API — one key covers both.
    apiKey: {
      polygonAmoy: POLYGONSCAN_API_KEY || "",
    },
  },
};
