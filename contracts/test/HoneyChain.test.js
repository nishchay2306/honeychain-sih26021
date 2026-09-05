const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HoneyChain (Stage 2 — role-gated)", function () {
  let honeyChain, admin, beekeeper, extractor, lab, packager, distributor, retailer, outsider;

  const ROLE = {
    BEEKEEPER: ethers.keccak256(ethers.toUtf8Bytes("BEEKEEPER_ROLE")),
    EXTRACTOR: ethers.keccak256(ethers.toUtf8Bytes("EXTRACTOR_ROLE")),
    LAB: ethers.keccak256(ethers.toUtf8Bytes("LAB_ROLE")),
    PACKAGER: ethers.keccak256(ethers.toUtf8Bytes("PACKAGER_ROLE")),
    DISTRIBUTOR: ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE")),
    RETAILER: ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE")),
  };

  beforeEach(async function () {
    [admin, beekeeper, extractor, lab, packager, distributor, retailer, outsider] =
      await ethers.getSigners();

    const HoneyChain = await ethers.getContractFactory("HoneyChain");
    honeyChain = await HoneyChain.deploy();
    await honeyChain.waitForDeployment();

    // admin (deployer) grants each role to its respective test account
    await honeyChain.connect(admin).grantRole(ROLE.BEEKEEPER, beekeeper.address);
    await honeyChain.connect(admin).grantRole(ROLE.EXTRACTOR, extractor.address);
    await honeyChain.connect(admin).grantRole(ROLE.LAB, lab.address);
    await honeyChain.connect(admin).grantRole(ROLE.PACKAGER, packager.address);
    await honeyChain.connect(admin).grantRole(ROLE.DISTRIBUTOR, distributor.address);
    await honeyChain.connect(admin).grantRole(ROLE.RETAILER, retailer.address);
  });

  it("registers a new batch with id 1 and Harvested stage (beekeeper only)", async function () {
    await expect(
      honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa, Haryana")
    ).to.emit(honeyChain, "BatchRegistered");

    const batch = await honeyChain.getBatch(1);
    expect(batch.beekeeper).to.equal(beekeeper.address);
    expect(batch.currentStage).to.equal(0);
  });

  it("rejects registerBatch from a wallet without BEEKEEPER_ROLE", async function () {
    await expect(
      honeyChain.connect(outsider).registerBatch("Mustard", "Sirsa")
    ).to.be.revertedWithCustomError(honeyChain, "MissingRole");
  });

  it("walks a batch through every stage with the correct role at each step", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");

    await honeyChain.connect(extractor).advanceStage(1, 1); // Extracted
    await honeyChain.connect(lab).advanceStage(1, 2); // LabTested
    await honeyChain.connect(packager).advanceStage(1, 3); // Packaged
    await honeyChain.connect(distributor).advanceStage(1, 4); // Distributed
    await honeyChain.connect(retailer).advanceStage(1, 5); // Sold

    const batch = await honeyChain.getBatch(1);
    expect(batch.currentStage).to.equal(5);

    const history = await honeyChain.getBatchHistory(1);
    expect(history.length).to.equal(6); // one entry per stage
  });

  it("rejects advanceStage when called by the WRONG role", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");

    // lab trying to do the extractor's job
    await expect(
      honeyChain.connect(lab).advanceStage(1, 1)
    ).to.be.revertedWithCustomError(honeyChain, "MissingRole");
  });

  it("rejects skipping a stage even with a valid role for a later stage", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");
    // lab has LAB_ROLE, but LabTested (2) can't be reached directly from Harvested (0)
    await expect(
      honeyChain.connect(lab).advanceStage(1, 2)
    ).to.be.revertedWithCustomError(honeyChain, "InvalidStageTransition");
  });

  it("reverts when querying a batch that does not exist", async function () {
    await expect(honeyChain.getBatch(999)).to.be.revertedWithCustomError(
      honeyChain,
      "BatchDoesNotExist"
    );
  });

  it("attaches a lab report hash (LAB_ROLE only)", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");

    await expect(
      honeyChain.connect(lab).attachLabReport(1, "bafybeigd...ipfsHash")
    )
      .to.emit(honeyChain, "LabReportAttached")
      .withArgs(1n, "bafybeigd...ipfsHash");

    const batch = await honeyChain.getBatch(1);
    expect(batch.labReportHash).to.equal("bafybeigd...ipfsHash");
  });

  it("rejects attachLabReport from a non-LAB_ROLE wallet", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");
    await expect(
      honeyChain.connect(beekeeper).attachLabReport(1, "someHash")
    ).to.be.revertedWithCustomError(honeyChain, "MissingRole");
  });

  it("admin can revoke a role and access is denied afterward", async function () {
    await honeyChain.connect(beekeeper).registerBatch("Mustard", "Sirsa");
    await honeyChain.connect(admin).revokeRole(ROLE.EXTRACTOR, extractor.address);

    await expect(
      honeyChain.connect(extractor).advanceStage(1, 1)
    ).to.be.revertedWithCustomError(honeyChain, "MissingRole");
  });
});
