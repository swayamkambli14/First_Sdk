// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BurnTracker.sol";

/**
 * @title CLoyaltyToken (CLP)
 * @notice Deflationary ERC-20 loyalty points token.
 *         - Hard supply cap set at deployment
 *         - 1% transfer tax burned on every transfer (configurable 0.5%–3%)
 *         - Manual redemption burn (100%)
 *         - Fraud penalty burn (FraudController only)
 *         - Tier decay burn (keeper only)
 *         - All burns recorded in BurnTracker for frontend analytics
 */
contract CLoyaltyToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE           = keccak256("MINTER_ROLE");
    bytes32 public constant FRAUD_CONTROLLER_ROLE = keccak256("FRAUD_CONTROLLER_ROLE");
    bytes32 public constant KEEPER_ROLE           = keccak256("KEEPER_ROLE");

    uint256 public immutable MAX_SUPPLY;

    // Burn rate in basis points (100 = 1%). Bounds: 50–300 (0.5%–3%)
    uint256 public burnRateBps = 100;
    uint256 public constant MIN_BURN_BPS = 50;
    uint256 public constant MAX_BURN_BPS = 300;

    uint256 public totalBurned;
    uint256 public totalMinted;
    uint256 public totalRedeemed;

    mapping(address => uint256) public userBurnedAmount;
    // Inactivity tracking for tier decay
    mapping(address => uint256) public lastActiveAt;
    uint256 public inactivityThreshold = 90 days;

    // Burn type constants (mirrors BurnTracker)
    uint8 private constant _BURN_TRANSFER_TAX  = 0;
    uint8 private constant _BURN_REDEMPTION    = 1;
    uint8 private constant _BURN_FRAUD_PENALTY = 2;
    uint8 private constant _BURN_TIER_DECAY    = 3;

    BurnTracker public immutable burnTracker;

    // ── Events ────────────────────────────────────────────────────────────────

    event TokensMinted(
        address indexed to,
        uint256 amount,
        bytes32 indexed appId,
        string  reason
    );
    event TokensBurned(
        address indexed from,
        uint256 amount,
        uint256 newTotalSupply
    );
    event TokensRedeemed(
        address indexed by,
        uint256 amount,
        string  rewardId
    );
    event PenaltyBurned(
        address indexed wallet,
        uint256 amount,
        bytes32 reason
    );
    event BurnRateUpdated(
        uint256 oldRate,
        uint256 newRate,
        address updatedBy
    );
    event TierDecayBurned(
        address indexed wallet,
        uint256 amount
    );

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address admin,
        address burnTrackerAddress,
        uint256 maxSupply
    ) ERC20("ChainLoyalty Points", "CLP") {
        require(admin != address(0),           "CLP: zero admin");
        require(burnTrackerAddress != address(0), "CLP: zero tracker");
        require(maxSupply > 0,                 "CLP: zero supply cap");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        burnTracker = BurnTracker(burnTrackerAddress);
        MAX_SUPPLY  = maxSupply;
    }

    // ── Minting ───────────────────────────────────────────────────────────────

    /**
     * @notice Mints CLP to a wallet. Only callable by MINTER_ROLE (RewardController).
     */
    function mint(
        address to,
        uint256 amount,
        bytes32 appId,
        string calldata reason
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0),                          "CLP: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY,      "CLP: supply cap exceeded");

        totalMinted        += amount;
        lastActiveAt[to]    = block.timestamp;

        _mint(to, amount);
        emit TokensMinted(to, amount, appId, reason);
    }

    // ── Transfer with burn tax ────────────────────────────────────────────────

    /**
     * @dev Overrides ERC20 _update to apply 1% burn tax on every transfer.
     *      Mints (from == address(0)) and burns (to == address(0)) are exempt.
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Exempt: minting and direct burns
        if (from == address(0) || to == address(0)) {
            super._update(from, to, amount);
            return;
        }

        uint256 burnAmount    = (amount * burnRateBps) / 10_000;
        uint256 transferAmount = amount - burnAmount;

        // Burn the tax portion
        if (burnAmount > 0) {
            super._update(from, address(0), burnAmount);
            _recordBurn(from, burnAmount, _BURN_TRANSFER_TAX);
        }

        // Transfer the remainder
        super._update(from, to, transferAmount);

        lastActiveAt[from] = block.timestamp;
        lastActiveAt[to]   = block.timestamp;
    }

    // ── Redemption burn ───────────────────────────────────────────────────────

    /**
     * @notice User burns their own tokens to claim a reward. 100% burned.
     */
    function redeemForReward(
        uint256 amount,
        string calldata rewardId
    ) external whenNotPaused {
        require(amount > 0,                    "CLP: zero amount");
        require(balanceOf(msg.sender) >= amount, "CLP: insufficient balance");

        totalRedeemed += amount;
        _burnAndRecord(msg.sender, amount, _BURN_REDEMPTION);

        emit TokensRedeemed(msg.sender, amount, rewardId);
    }

    // ── Fraud penalty burn ────────────────────────────────────────────────────

    /**
     * @notice Burns tokens from a fraud-flagged wallet. Only FraudController.
     */
    function penaltyBurn(
        address wallet,
        uint256 amount,
        bytes32 reason
    ) external onlyRole(FRAUD_CONTROLLER_ROLE) {
        require(wallet != address(0), "CLP: zero address");
        require(amount > 0,           "CLP: zero amount");
        require(balanceOf(wallet) >= amount, "CLP: insufficient balance");

        _burnAndRecord(wallet, amount, _BURN_FRAUD_PENALTY);
        emit PenaltyBurned(wallet, amount, reason);
    }

    // ── Tier decay burn ───────────────────────────────────────────────────────

    /**
     * @notice Burns 5% of an inactive user's balance. Only KEEPER_ROLE.
     *         Wallet must have been inactive for >= inactivityThreshold.
     */
    function tierDecayBurn(address wallet) external onlyRole(KEEPER_ROLE) {
        require(wallet != address(0), "CLP: zero address");
        require(
            block.timestamp - lastActiveAt[wallet] >= inactivityThreshold,
            "CLP: wallet not inactive long enough"
        );

        uint256 bal    = balanceOf(wallet);
        uint256 decay  = (bal * 500) / 10_000; // 5%
        if (decay == 0) return;

        _burnAndRecord(wallet, decay, _BURN_TIER_DECAY);
        emit TierDecayBurned(wallet, decay);
    }

    // ── Governance ────────────────────────────────────────────────────────────

    /**
     * @notice Updates the transfer burn rate. Bounded to 0.5%–3%.
     */
    function setBurnRate(uint256 newRateBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRateBps >= MIN_BURN_BPS && newRateBps <= MAX_BURN_BPS, "CLP: rate out of bounds");
        emit BurnRateUpdated(burnRateBps, newRateBps, msg.sender);
        burnRateBps = newRateBps;
    }

    function setInactivityThreshold(uint256 threshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(threshold >= 30 days, "CLP: threshold too short");
        inactivityThreshold = threshold;
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _burnAndRecord(address wallet, uint256 amount, uint8 burnType) internal {
        super._update(wallet, address(0), amount);
        _recordBurn(wallet, amount, burnType);
    }

    function _recordBurn(address wallet, uint256 amount, uint8 burnType) internal {
        totalBurned              += amount;
        userBurnedAmount[wallet] += amount;
        emit TokensBurned(wallet, amount, totalSupply());
        // Best-effort — don't revert if tracker call fails
        try burnTracker.recordBurn(wallet, amount, burnType) {} catch {}
    }
}
