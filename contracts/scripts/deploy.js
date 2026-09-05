const hre = require("hardhat");

async function main() {
  console.log("Deploying HoneyChain to network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "MATIC"
  );

  const HoneyChain = await hre.ethers.getContractFactory("HoneyChain");
  const honeyChain = await HoneyChain.deploy();
  await honeyChain.waitForDeployment();

  const address = await honeyChain.getAddress();
  console.log("\n✅ HoneyChain deployed to:", address);
  console.log(
    `View on Polygonscan (Amoy): https://amoy.polygonscan.com/address/${address}`
  );

  // For hackathon demo convenience, grant the deployer every role so a
  // single wallet can walk a batch through the entire lifecycle live.
  // In a real rollout, each role would go to a different KVIC-onboarded
  // wallet (beekeeper, extraction centre, lab, distributor, retailer).
  console.log("\nGranting deployer all roles for demo purposes...");
  const roleNames = [
    "BEEKEEPER_ROLE",
    "EXTRACTOR_ROLE",
    "LAB_ROLE",
    "PACKAGER_ROLE",
    "DISTRIBUTOR_ROLE",
    "RETAILER_ROLE",
  ];
  for (const roleName of roleNames) {
    const role = await honeyChain[roleName]();
    const tx = await honeyChain.grantRole(role, deployer.address);
    await tx.wait();
    console.log(`  granted ${roleName}`);
  }

  console.log(
    "\nNext step: verify the source with:\n" +
      `  npx hardhat verify --network amoy ${address}`
  );
  console.log(
    "\nTo onboard a real team member as e.g. a lab, from the Hardhat console or a script:\n" +
      `  await honeyChain.grantRole(await honeyChain.LAB_ROLE(), "0xTheirWalletAddress")`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
