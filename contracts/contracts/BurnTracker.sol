// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BurnTracker
 * @notice Append-only on-chain analytics log for all CLP burn events.
 *         Deployed first — no dependencies. All other contracts write to it.
 *
 * AUDIT NOTES (existing BadgeNFT.sol):
 * - NO burn mechanism existed. Points were purely off-chain in Postgres.
 * - safeTransferFrom soulbound override was dead code for the mint path
 *   (_mint calls _update directly, not safeTransferFrom).
 * - No zero-address check on mint(to, ...).
 * - No token supply cap.
 * - No fraud penalty, no decay, no redemption burn.
 * All of the above are fixed in this upgraded contract system.
 */
contract BurnTracker is AccessControl {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    uint8 public constant BURN_TRANSFER_TAX  = 0;
    uint8 public constant BURN_REDEMPTION    = 1;
    uint8 public constant BURN_FRAUD_PENALTY = 2;
    uint8 public constant BURN_TIER_DECAY    = 3;
    uint8 public constant BURN_BADGE_MINT    = 4;

    struct BurnEvent {
        address wallet;
        uint256 amount;
        uint256 timestamp;
        uint8   burnType;
    }

    BurnEvent[] public burnHistory;

    uint256 public allTimeBurned;
    uint256 public burnEventsCount;

    // Rolling windows — updated on each recordBurn call
    // Stored as (windowStart, accumulated) pairs; reset when window expires
    uint256 private _window24hStart;
    uint256 private _window24hAccum;
    uint256 private _window7dStart;
    uint256 private _window7dAccum;
    uint256 private _window30dStart;
    uint256 private _window30dAccum;

    event BurnRecorded(
        address indexed wallet,
        uint256 amount,
        uint8   burnType,
        uint256 allTimeBurned,
        uint256 timestamp
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Records a burn event. Called by CLoyaltyToken and BadgeNFT.
     * @param wallet  The wallet whose tokens were burned
     * @param amount  Amount burned (in wei / smallest unit)
     * @param burnType One of the BURN_* constants above
     */
    function recordBurn(
        address wallet,
        uint256 amount,
        uint8   burnType
    ) external onlyRole(RECORDER_ROLE) {
        require(amount > 0, "BurnTracker: zero amount");

        burnHistory.push(BurnEvent({
            wallet:    wallet,
            amount:    amount,
            timestamp: block.timestamp,
            burnType:  burnType
        }));

        allTimeBurned    += amount;
        burnEventsCount  += 1;

        // Update rolling windows
        _updateWindow(amount);

        emit BurnRecorded(wallet, amount, burnType, allTimeBurned, block.timestamp);
    }

    // ── View functions ────────────────────────────────────────────────────────

    function getBurnedLast24Hours() external view returns (uint256) {
        if (block.timestamp - _window24hStart > 1 days) return 0;
        return _window24hAccum;
    }

    function getBurnedLast7Days() external view returns (uint256) {
        if (block.timestamp - _window7dStart > 7 days) return 0;
        return _window7dAccum;
    }

    function getBurnedLast30Days() external view returns (uint256) {
        if (block.timestamp - _window30dStart > 30 days) return 0;
        return _window30dAccum;
    }

    /**
     * @notice Returns the most recent `count` burn events (newest first).
     */
    function getRecentBurns(uint256 count) external view returns (BurnEvent[] memory) {
        uint256 len = burnHistory.length;
        uint256 n   = count > len ? len : count;
        BurnEvent[] memory result = new BurnEvent[](n);
        for (uint256 i = 0; i < n; i++) {
            result[i] = burnHistory[len - 1 - i];
        }
        return result;
    }

    /**
     * @notice Returns burn breakdown by type (amounts per category).
     */
    function getBurnByType() external view returns (uint256[5] memory totals) {
        uint256 len = burnHistory.length;
        for (uint256 i = 0; i < len; i++) {
            uint8 t = burnHistory[i].burnType;
            if (t < 5) totals[t] += burnHistory[i].amount;
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _updateWindow(uint256 amount) internal {
        uint256 ts = block.timestamp;

        if (ts - _window24hStart > 1 days) {
            _window24hStart = ts;
            _window24hAccum = amount;
        } else {
            _window24hAccum += amount;
        }

        if (ts - _window7dStart > 7 days) {
            _window7dStart = ts;
            _window7dAccum = amount;
        } else {
            _window7dAccum += amount;
        }

        if (ts - _window30dStart > 30 days) {
            _window30dStart = ts;
            _window30dAccum = amount;
        } else {
            _window30dAccum += amount;
        }
    }
}
