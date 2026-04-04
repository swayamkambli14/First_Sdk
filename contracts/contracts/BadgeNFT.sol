// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./CLoyaltyToken.sol";
import "./BurnTracker.sol";

contract BadgeNFT is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE    = keccak256("MINTER_ROLE");
    uint8 public constant RARITY_COMMON    = 0;
    uint8 public constant RARITY_RARE      = 1;
    uint8 public constant RARITY_EPIC      = 2;
    uint8 public constant RARITY_LEGENDARY = 3;

    struct BadgeType {
        uint8   rarity;
        uint256 expiryTimestamp;
        uint256 clpCost;
        uint256 minClpBalance;
        bytes32 metadataHash;
        string  uri;
    }

    mapping(uint256 => BadgeType) public badgeTypes;
    mapping(uint256 => string)    private _badgeURIs;
    CLoyaltyToken public immutable clpToken;
    BurnTracker   public immutable burnTracker;

    event BadgeMinted(address indexed recipient, uint256 indexed badgeTypeId, uint8 rarity, uint256 timestamp);
    event BadgeMintedWithPayment(address indexed wallet, uint256 indexed badgeTypeId, uint256 clpPaid);
    event BadgeEvolved(address indexed wallet, uint256[] burnedIds, uint256 newBadgeId);
    event BadgeTypeRegistered(uint256 indexed badgeTypeId, uint8 rarity, uint256 clpCost, bytes32 metadataHash);

    constructor(address admin, address clpTokenAddress, address burnTrackerAddress) ERC1155("") {
        require(admin != address(0),              "BadgeNFT: zero admin");
        require(clpTokenAddress != address(0),    "BadgeNFT: zero CLP");
        require(burnTrackerAddress != address(0), "BadgeNFT: zero tracker");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        clpToken    = CLoyaltyToken(clpTokenAddress);
        burnTracker = BurnTracker(burnTrackerAddress);
    }

    function registerBadgeType(
        uint256 badgeTypeId, uint8 rarity, uint256 expiryTimestamp,
        uint256 clpCost, uint256 minClpBalance, bytes32 metadataHash,
        string calldata badgeUri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rarity <= RARITY_LEGENDARY, "BadgeNFT: invalid rarity");
        require(bytes(badgeUri).length > 0, "BadgeNFT: empty URI");
        badgeTypes[badgeTypeId] = BadgeType(rarity, expiryTimestamp, clpCost, minClpBalance, metadataHash, badgeUri);
        _badgeURIs[badgeTypeId] = badgeUri;
        emit BadgeTypeRegistered(badgeTypeId, rarity, clpCost, metadataHash);
    }

    function mint(address to, uint256 badgeTypeId, string calldata badgeUri)
        external onlyRole(MINTER_ROLE) whenNotPaused
    {
        require(to != address(0),                "BadgeNFT: mint to zero");
        require(balanceOf(to, badgeTypeId) == 0, "BadgeNFT: already holds badge");
        BadgeType storage bt = badgeTypes[badgeTypeId];
        if (bt.rarity == RARITY_LEGENDARY && bt.minClpBalance > 0) {
            require(clpToken.balanceOf(to) >= bt.minClpBalance, "BadgeNFT: insufficient CLP for LEGENDARY");
        }
        if ((bt.rarity == RARITY_EPIC || bt.rarity == RARITY_LEGENDARY) && bt.clpCost > 0) {
            require(clpToken.balanceOf(to) >= bt.clpCost, "BadgeNFT: insufficient CLP for mint cost");
            clpToken.penaltyBurn(to, bt.clpCost, keccak256("BADGE_MINT_COST"));
            try burnTracker.recordBurn(to, bt.clpCost, 4) {} catch {}
            emit BadgeMintedWithPayment(to, badgeTypeId, bt.clpCost);
        }
        if (bytes(_badgeURIs[badgeTypeId]).length == 0) { _badgeURIs[badgeTypeId] = badgeUri; }
        _mint(to, badgeTypeId, 1, "");
        emit BadgeMinted(to, badgeTypeId, bt.rarity, block.timestamp);
    }

    function evolveBadge(uint256[] calldata burnIds, uint256 targetBadgeId) external whenNotPaused {
        require(burnIds.length == 3, "BadgeNFT: must burn exactly 3 badges");
        uint8 sourceRarity = badgeTypes[burnIds[0]].rarity;
        require(badgeTypes[targetBadgeId].rarity == sourceRarity + 1, "BadgeNFT: target must be one tier higher");
        for (uint256 i = 0; i < 3; i++) {
            require(badgeTypes[burnIds[i]].rarity == sourceRarity, "BadgeNFT: mismatched rarity");
            require(balanceOf(msg.sender, burnIds[i]) >= 1, "BadgeNFT: missing source badge");
            _burn(msg.sender, burnIds[i], 1);
        }
        require(balanceOf(msg.sender, targetBadgeId) == 0, "BadgeNFT: already holds target");
        _mint(msg.sender, targetBadgeId, 1, "");
        emit BadgeEvolved(msg.sender, burnIds, targetBadgeId);
    }

    function isValidBadge(address wallet, uint256 badgeTypeId) external view returns (bool) {
        if (balanceOf(wallet, badgeTypeId) == 0) return false;
        uint256 expiry = badgeTypes[badgeTypeId].expiryTimestamp;
        if (expiry != 0 && block.timestamp > expiry) return false;
        return true;
    }

    function uri(uint256 badgeTypeId) public view override returns (string memory) {
        string memory u = _badgeURIs[badgeTypeId];
        require(bytes(u).length > 0, "BadgeNFT: URI not set");
        return u;
    }

    function setBadgeURI(uint256 badgeTypeId, string calldata badgeUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(badgeUri).length > 0, "BadgeNFT: empty URI");
        _badgeURIs[badgeTypeId] = badgeUri;
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        require(from == address(0) || to == address(0), "BadgeNFT: soulbound");
        super._update(from, to, ids, values);
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function renounceRole(bytes32 role, address callerConfirmation) public override {
        require(role != DEFAULT_ADMIN_ROLE, "BadgeNFT: cannot renounce admin");
        super.renounceRole(role, callerConfirmation);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControl) returns (bool)
    { return super.supportsInterface(interfaceId); }
}
