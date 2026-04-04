// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./CLoyaltyToken.sol";
import "./BadgeNFT.sol";
import "./ReferralRegistry.sol";

/**
 * @title RewardController
 * @notice Single entry point for all reward issuance.
 *         The backend never calls CLoyaltyToken or BadgeNFT directly.
 *
 * Roles:
 *   BACKEND_ROLE           — normal reward issuance (single signer)
 *   FRAUD_CONTROLLER_ROLE  — penalty burns
 *   GOVERNANCE_ROLE        — parameter changes
 *
 * Large mint threshold: minting > LARGE_MINT_THRESHOLD in one call
 * requires GOVERNANCE_ROLE (acts as a second-signer guard).
 */
contract RewardController is AccessControl, Pausable {
    bytes32 public constant BACKEND_ROLE           = keccak256("BACKEND_ROLE");
    bytes32 public constant FRAUD_CONTROLLER_ROLE  = keccak256("FRAUD_CONTROLLER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE        = keccak256("GOVERNANCE_ROLE");

    uint256 public LARGE_MINT_THRESHOLD = 10_000 * 1e18;

    CLoyaltyToken     public immutable clpToken;
    BadgeNFT          public immutable badgeNFT;
    ReferralRegistry  public immutable referralRegistry;

    event PointsIssued(address indexed wallet, uint256 amount, bytes32 indexed appId, string reason);
    event BadgeIssued(address indexed wallet, uint256 indexed badgeTypeId, bytes32 indexed appId);
    event ReferralRewardIssued(address indexed referrer, address indexed referee, uint256 referrerAmt, uint256 refereeAmt);
    event FraudPenaltyExecuted(address indexed wallet, uint256 amount, bytes32 evidenceHash);
    event LargeMintThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    constructor(
        address admin,
        address clpTokenAddress,
        address badgeNFTAddress,
        address referralRegistryAddress
    ) {
        require(admin != address(0),                  "RC: zero admin");
        require(clpTokenAddress != address(0),        "RC: zero CLP");
        require(badgeNFTAddress != address(0),        "RC: zero badge");
        require(referralRegistryAddress != address(0),"RC: zero referral");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);

        clpToken         = CLoyaltyToken(clpTokenAddress);
        badgeNFT         = BadgeNFT(badgeNFTAddress);
        referralRegistry = ReferralRegistry(referralRegistryAddress);
    }

    // ── Points issuance ───────────────────────────────────────────────────────

    /**
     * @notice Issues CLP points to a wallet.
     *         Large mints (> LARGE_MINT_THRESHOLD) require GOVERNANCE_ROLE.
     */
    function issuePoints(
        address wallet,
        uint256 amount,
        bytes32 appId,
        string calldata reason
    ) external whenNotPaused {
        if (amount > LARGE_MINT_THRESHOLD) {
            _checkRole(GOVERNANCE_ROLE);
        } else {
            _checkRole(BACKEND_ROLE);
        }
        clpToken.mint(wallet, amount, appId, reason);
        emit PointsIssued(wallet, amount, appId, reason);
    }

    /**
     * @notice Batch issue points to multiple wallets. Gas-efficient for bulk rewards.
     *         Max 200 wallets per call to stay under block gas limit.
     */
    function batchIssuePoints(
        address[] calldata wallets,
        uint256[] calldata amounts,
        bytes32 appId
    ) external onlyRole(BACKEND_ROLE) whenNotPaused {
        require(wallets.length == amounts.length, "RC: length mismatch");
        require(wallets.length <= 200,            "RC: batch too large");
        for (uint256 i = 0; i < wallets.length; i++) {
            clpToken.mint(wallets[i], amounts[i], appId, "batch_reward");
            emit PointsIssued(wallets[i], amounts[i], appId, "batch_reward");
        }
    }

    // ── Badge issuance ────────────────────────────────────────────────────────

    function issueBadge(
        address wallet,
        uint256 badgeTypeId,
        bytes32 appId,
        string calldata badgeUri
    ) external onlyRole(BACKEND_ROLE) whenNotPaused {
        badgeNFT.mint(wallet, badgeTypeId, badgeUri);
        emit BadgeIssued(wallet, badgeTypeId, appId);
    }

    // ── Referral rewards ──────────────────────────────────────────────────────

    /**
     * @notice Issues rewards to both referrer and referee atomically.
     *         If either mint fails, the whole transaction reverts.
     */
    function issueReferralReward(
        address referrer,
        address referee,
        uint256 referrerAmount,
        uint256 refereeAmount,
        bytes32 appId
    ) external onlyRole(BACKEND_ROLE) whenNotPaused {
        clpToken.mint(referrer, referrerAmount, appId, "referral_referrer");
        clpToken.mint(referee,  refereeAmount,  appId, "referral_referee");
        referralRegistry.emitRewarded(referrer, referee, referrerAmount, refereeAmount);
        emit ReferralRewardIssued(referrer, referee, referrerAmount, refereeAmount);
    }

    // ── Fraud penalty ─────────────────────────────────────────────────────────

    function executeFraudPenalty(
        address wallet,
        uint256 burnAmount,
        bytes32 evidenceHash
    ) external onlyRole(FRAUD_CONTROLLER_ROLE) {
        clpToken.penaltyBurn(wallet, burnAmount, evidenceHash);
        emit FraudPenaltyExecuted(wallet, burnAmount, evidenceHash);
    }

    // ── Governance ────────────────────────────────────────────────────────────

    function setLargeMintThreshold(uint256 newThreshold) external onlyRole(GOVERNANCE_ROLE) {
        emit LargeMintThresholdUpdated(LARGE_MINT_THRESHOLD, newThreshold);
        LARGE_MINT_THRESHOLD = newThreshold;
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
