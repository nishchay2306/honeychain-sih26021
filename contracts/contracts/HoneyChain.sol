// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HoneyChain
 * @notice Honey Chain traceability system (SIH26021) — Stage 2.
 *         Tracks a honey batch from harvest through to consumer sale on an
 *         immutable ledger, with role-gated stage transitions so only the
 *         authorized actor at each step can move a batch forward
 *         (Task 2.1: AccessControl, Task 2.2: role-gated lifecycle).
 *
 *         Role model: each Stage transition has exactly one role allowed to
 *         perform it. The deployer receives DEFAULT_ADMIN_ROLE and can grant
 *         the other roles to real wallet addresses as the team/KVIC cluster
 *         onboards beekeepers, extraction centres, labs, distributors and
 *         retailers.
 */
contract HoneyChain is AccessControl {
    bytes32 public constant BEEKEEPER_ROLE = keccak256("BEEKEEPER_ROLE");
    bytes32 public constant EXTRACTOR_ROLE = keccak256("EXTRACTOR_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");
    bytes32 public constant PACKAGER_ROLE = keccak256("PACKAGER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    constructor() {
        // Deployer is the admin — can grant/revoke every role below.
        // In production this would be a KVIC coordinator's wallet, or a
        // multisig, rather than a single EOA.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @dev Returns the single role permitted to move a batch INTO `stage`.
    function _roleForStage(Stage stage) internal pure returns (bytes32) {
        if (stage == Stage.Harvested) return BEEKEEPER_ROLE;
        if (stage == Stage.Extracted) return EXTRACTOR_ROLE;
        if (stage == Stage.LabTested) return LAB_ROLE;
        if (stage == Stage.Packaged) return PACKAGER_ROLE;
        if (stage == Stage.Distributed) return DISTRIBUTOR_ROLE;
        return RETAILER_ROLE; // Stage.Sold
    }
    /// @notice The stages a batch moves through, in order.
    enum Stage {
        Harvested, // 0 - beekeeper has harvested the batch
        Extracted, // 1 - honey extracted from the batch
        LabTested, // 2 - lab test completed, report hash stored
        Packaged, // 3 - packaged, QR code issued
        Distributed, // 4 - handed to a distributor/retailer
        Sold // 5 - sold to the end consumer
    }

    /// @notice Core on-chain record for a single honey batch.
    struct Batch {
        uint256 id; // unique batch id
        address beekeeper; // wallet address of the registering beekeeper
        string floralSource; // e.g. "Mustard", "Litchi", "Multi-floral"
        string harvestLocation; // free-text location / geo-tag string
        uint256 harvestTimestamp; // unix timestamp of harvest
        string labReportHash; // IPFS hash of the lab test report (empty until LabTested)
        Stage currentStage; // current position in the lifecycle
        bool exists; // guards against querying a non-existent batch
    }

    /// @notice One row of a batch's audit trail.
    struct StageUpdate {
        Stage stage;
        address updatedBy;
        uint256 timestamp;
    }

    /// @dev batchId => Batch
    mapping(uint256 => Batch) private batches;

    /// @dev batchId => ordered list of every stage transition (the audit trail)
    mapping(uint256 => StageUpdate[]) private batchHistory;

    /// @dev running counter used to assign the next batch id
    uint256 private nextBatchId = 1;

    // ---------------------------------------------------------------------
    // Events — the frontend/backend listens to these to index activity
    // ---------------------------------------------------------------------

    event BatchRegistered(
        uint256 indexed batchId,
        address indexed beekeeper,
        string floralSource,
        uint256 harvestTimestamp
    );

    event StageAdvanced(
        uint256 indexed batchId,
        Stage newStage,
        address indexed updatedBy,
        uint256 timestamp
    );

    event LabReportAttached(uint256 indexed batchId, string labReportHash);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error BatchDoesNotExist(uint256 batchId);
    error InvalidStageTransition(Stage current, Stage attempted);
    error MissingRole(address account, bytes32 requiredRole);

    // ---------------------------------------------------------------------
    // Write functions
    // ---------------------------------------------------------------------

    /**
     * @notice Register a newly harvested batch. Restricted to wallets holding
     *         BEEKEEPER_ROLE (Task 2.1/2.2 — was open to anyone in Stage 1).
     * @param floralSource e.g. "Mustard", "Litchi"
     * @param harvestLocation free-text location string (can be lat/long)
     * @return batchId the id assigned to the new batch
     */
    function registerBatch(
        string calldata floralSource,
        string calldata harvestLocation
    ) external returns (uint256 batchId) {
        if (!hasRole(BEEKEEPER_ROLE, msg.sender)) {
            revert MissingRole(msg.sender, BEEKEEPER_ROLE);
        }

        batchId = nextBatchId++;

        batches[batchId] = Batch({
            id: batchId,
            beekeeper: msg.sender,
            floralSource: floralSource,
            harvestLocation: harvestLocation,
            harvestTimestamp: block.timestamp,
            labReportHash: "",
            currentStage: Stage.Harvested,
            exists: true
        });

        batchHistory[batchId].push(
            StageUpdate({
                stage: Stage.Harvested,
                updatedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit BatchRegistered(batchId, msg.sender, floralSource, block.timestamp);
    }

    /**
     * @notice Move a batch to the next stage in its lifecycle. Restricted to
     *         the single role authorized for the TARGET stage (Task 2.1/2.2)
     *         — e.g. only a LAB_ROLE wallet can move a batch into LabTested.
     * @param batchId the batch to advance
     * @param newStage the stage to move to (must be exactly current + 1)
     */
    function advanceStage(uint256 batchId, Stage newStage) external {
        Batch storage b = batches[batchId];
        if (!b.exists) revert BatchDoesNotExist(batchId);

        if (uint8(newStage) != uint8(b.currentStage) + 1) {
            revert InvalidStageTransition(b.currentStage, newStage);
        }

        bytes32 requiredRole = _roleForStage(newStage);
        if (!hasRole(requiredRole, msg.sender)) {
            revert MissingRole(msg.sender, requiredRole);
        }

        b.currentStage = newStage;

        batchHistory[batchId].push(
            StageUpdate({
                stage: newStage,
                updatedBy: msg.sender,
                timestamp: block.timestamp
            })
        );

        emit StageAdvanced(batchId, newStage, msg.sender, block.timestamp);
    }

    /**
     * @notice Attach a lab report hash (e.g. an IPFS CID) to a batch.
     *         Restricted to LAB_ROLE. Intended to be called around the time
     *         the batch reaches Stage.LabTested.
     */
    function attachLabReport(uint256 batchId, string calldata labReportHash) external {
        if (!hasRole(LAB_ROLE, msg.sender)) {
            revert MissingRole(msg.sender, LAB_ROLE);
        }
        Batch storage b = batches[batchId];
        if (!b.exists) revert BatchDoesNotExist(batchId);

        b.labReportHash = labReportHash;
        emit LabReportAttached(batchId, labReportHash);
    }

    // ---------------------------------------------------------------------
    // Read functions — used by the consumer QR scan page & dashboards
    // ---------------------------------------------------------------------

    /// @notice Full current record for a batch.
    function getBatch(uint256 batchId) external view returns (Batch memory) {
        if (!batches[batchId].exists) revert BatchDoesNotExist(batchId);
        return batches[batchId];
    }

    /// @notice Full audit trail (every stage transition) for a batch —
    ///         this is what powers the "chain of custody" timeline on the
    ///         consumer-facing QR scan page.
    function getBatchHistory(uint256 batchId) external view returns (StageUpdate[] memory) {
        if (!batches[batchId].exists) revert BatchDoesNotExist(batchId);
        return batchHistory[batchId];
    }

    /// @notice Total number of batches ever registered (handy for indexing/pagination).
    function totalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }
}
