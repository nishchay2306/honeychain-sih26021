const HoneyChainABI = require("./HoneyChainABI.json");

module.exports = {
  HoneyChainABI,
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || null,
  RPC_URL: process.env.AMOY_RPC_URL || null,
};
