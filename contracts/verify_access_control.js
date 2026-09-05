/**
 * Verifies Task 2.1/2.2 (role-gated batch lifecycle) end-to-end:
 * compiles HoneyChain.sol with solc, deploys it to a local in-process
 * Ganache EVM, then calls functions from different accounts to prove
 * the role restrictions actually work (not just that the code compiles).
 *
 * This exists as an alternative to `npx hardhat test` for environments
 * where Hardhat's own compiler downloader is blocked (e.g. restricted
 * sandboxes/CI). On a normal machine with full internet access, feel
 * free to also write/run standard Hardhat tests in test/ — this script
 * doesn't replace that, it's just a network-independent sanity check.
 *
 * Run with: node verify_access_control.js
 */
const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");
const ganache = require("ganache");

function compile() {
  const srcPath = path.join(__dirname, "contracts", "HoneyChain.sol");
  const source = fs.readFileSync(srcPath, "utf8");
  const nodeModules = path.join(__dirname, "node_modules");

  function findImports(importPath) {
    try {
      return { contents: fs.readFileSync(path.join(nodeModules, importPath), "utf8") };
    } catch (e) {
      return { error: "File not found: " + importPath };
    }
  }

  const input = {
    language: "Solidity",
    sources: { "HoneyChain.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  const errors = (output.errors || []).filter((e) => e.severity === "error");
  if (errors.length > 0) {
    errors.forEach((e) => console.error(e.formattedMessage));
    throw new Error("Compilation failed");
  }

  const contract = output.contracts["HoneyChain.sol"]["HoneyChain"];
  return { abi: contract.abi, bytecode: "0x" + contract.evm.bytecode.object };
}

function roleId(name) {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
}

let pass = 0;
let fail = 0;
function check(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    fail++;
  }
}

async function main() {
  console.log("Compiling HoneyChain.sol...");
  const { abi, bytecode } = compile();
  console.log("✅ Compiled\n");

  const server = ganache.provider({ logging: { quiet: true } });
  const provider = new ethers.BrowserProvider(server);

  const admin = await provider.getSigner(0);
  const beekeeper = await provider.getSigner(1);
  const extractor = await provider.getSigner(2);
  const randomOutsider = await provider.getSigner(3);

  console.log("Deploying HoneyChain (admin =", await admin.getAddress(), ")...\n");

  const factory = new ethers.ContractFactory(abi, bytecode, admin);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  console.log("Deployed at:", await contract.getAddress(), "\n");

  const BEEKEEPER_ROLE = roleId("BEEKEEPER_ROLE");
  const EXTRACTOR_ROLE = roleId("EXTRACTOR_ROLE");

  console.log("TEST 1: unauthorized wallet cannot register a batch");
  try {
    await contract.connect(randomOutsider).registerBatch("Mustard", "Sirsa");
    check("outsider registerBatch() should have reverted", false);
  } catch (err) {
    check("outsider registerBatch() reverted as expected", /MissingRole|revert/i.test(err.message));
  }

  console.log("\nTEST 2: grant BEEKEEPER_ROLE, then registration succeeds");
  await contract.connect(admin).grantRole(BEEKEEPER_ROLE, await beekeeper.getAddress());
  check("beekeeper now holds BEEKEEPER_ROLE", await contract.hasRole(BEEKEEPER_ROLE, await beekeeper.getAddress()));

  await (await contract.connect(beekeeper).registerBatch("Mustard", "Sirsa, Haryana")).wait();
  const batch = await contract.getBatch(1);
  check("batch 1 registered with Harvested stage", Number(batch.currentStage) === 0);

  console.log("\nTEST 3: wrong role cannot advance the stage");
  try {
    await contract.connect(beekeeper).advanceStage(1, 1);
    check("beekeeper advancing to Extracted should have reverted", false);
  } catch (err) {
    check("beekeeper advanceStage() reverted (missing EXTRACTOR_ROLE)", /MissingRole|revert/i.test(err.message));
  }

  console.log("\nTEST 4: correct role CAN advance the stage");
  await contract.connect(admin).grantRole(EXTRACTOR_ROLE, await extractor.getAddress());
  await (await contract.connect(extractor).advanceStage(1, 1)).wait();
  const batchAfter = await contract.getBatch(1);
  check("batch 1 advanced to Extracted (stage 1)", Number(batchAfter.currentStage) === 1);

  console.log("\nTEST 5: revoke role, access is denied again");
  await contract.connect(admin).revokeRole(EXTRACTOR_ROLE, await extractor.getAddress());
  try {
    await contract.connect(extractor).advanceStage(1, 2);
    check("revoked extractor should not be able to advance further", false);
  } catch (err) {
    check("revoked extractor correctly denied", /MissingRole|revert/i.test(err.message));
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`RESULT: ${pass} passed, ${fail} failed`);
  console.log("=".repeat(50));

  await server.disconnect?.();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
