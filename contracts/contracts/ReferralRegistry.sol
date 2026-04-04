// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReferralRegistry
 * @notice On-chain referral attribution. Standalone — no token dependencies.
 */
contract ReferralRegistry is AccessControl {
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    mapping(address => address)   public referredBy;
    mapping(address => address[]) private _referrals;
    mapping(bytes32 => address)   public codeToWallet;
    mapping(address => bool)      public hasBeenReferred;

    event ReferralRegistered(address indexed referrer, address indexed referee, bytes32 codeHash);
    event ReferralRewarded(address indexed referrer, address indexed referee, uint256 referrerReward, uint256 refereeReward);
    event FraudulentReferralBlocked(address indexed attacker, bytes32 reason);
    event ReferralCodeRegistered(address indexed wallet, bytes32 codeHash);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerCode(address wallet, bytes32 codeHash) external onlyRole(BACKEND_ROLE) {
        require(wallet != address(0),          "RR: zero wallet");
        require(codeToWallet[codeHash] == address(0), "RR: code already registered");
        codeToWallet[codeHash] = wallet;
        emit ReferralCodeRegistered(wallet, codeHash);
    }

    function registerReferral(address referee, bytes32 codeHash) external onlyRole(BACKEND_ROLE) {
        require(referee != address(0),         "RR: zero referee");
        require(!hasBeenReferred[referee],     "RR: already referred");

        address referrer = codeToWallet[codeHash];
        require(referrer != address(0),        "RR: unknown code");

        // Self-referral check
        if (referrer == referee) {
            emit FraudulentReferralBlocked(referee, keccak256("SELF_REFERRAL"));
            return;
        }

        // Circular referral check
        if (referredBy[referrer] == referee) {
            emit FraudulentReferralBlocked(referee, keccak256("CIRCULAR_REFERRAL"));
            return;
        }

        referredBy[referee]    = referrer;
        hasBeenReferred[referee] = true;
        _referrals[referrer].push(referee);

        emit ReferralRegistered(referrer, referee, codeHash);
    }

    function emitRewarded(
        address referrer, address referee,
        uint256 referrerReward, uint256 refereeReward
    ) external onlyRole(BACKEND_ROLE) {
        emit ReferralRewarded(referrer, referee, referrerReward, refereeReward);
    }

    function getReferralCount(address wallet) external view returns (uint256) {
        return _referrals[wallet].length;
    }

    function getReferrals(address wallet) external view returns (address[] memory) {
        return _referrals[wallet];
    }

    function getReferralChain(address wallet) external view returns (address[] memory) {
        // Walk up the referral tree — max 10 levels to prevent gas issues
        address[] memory chain = new address[](10);
        uint256 depth = 0;
        address current = referredBy[wallet];
        while (current != address(0) && depth < 10) {
            chain[depth] = current;
            depth++;
            current = referredBy[current];
        }
        address[] memory result = new address[](depth);
        for (uint256 i = 0; i < depth; i++) result[i] = chain[i];
        return result;
    }
}
