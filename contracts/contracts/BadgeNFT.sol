// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./CLoyaltyToken.sol";
import "./BurnTracker.sol";

contract BadgeNFT is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE    = keccak256("MINTER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

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

    // Fixed ETH mint prices per rarity tier
    mapping(uint8 => uint256) public rarityMintPrice;

    CLoyaltyToken public immutable clpToken;
    BurnTracker   public immutable burnTracker;

    // ── Events ────────────────────────────────────────────────────────────────
    event BadgeMinted(address indexed recipient, uint256 indexed badgeTypeId, uint8 rarity, uint256 timestamp);
    event BadgeMintedWithPayment(address indexed wallet, uint256 indexed badgeTypeId, uint256 clpPaid);
    event BadgeEvolved(address indexed wallet, uint256[] burnedIds, uint256 newBadgeId);
    event BadgeTypeRegistered(uint256 indexed badgeTypeId, uint8 rarity, uint256 clpCost, bytes32 metadataHash);
    event MintPriceUpdated(uint8 rarity, uint256 oldPrice, uint256 newPrice);
    event FundsWithdrawn(address treasury, uint256 amount);
    event BadgePurchased(address indexed buyer, uint256 indexed badgeTypeId, uint256 pricePaid);

    constructor(address admin, address clpTokenAddress, address burnTrackerAddress) ERC1155("") {
        require(admin != address(0),              "BadgeNFT: zero admin");
        require(clpTokenAddress != address(0),    "BadgeNFT: zero CLP");
        require(burnTrackerAddress != address(0), "BadgeNFT: zero tracker");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(GOVERNANCE_ROLE, admin);

        clpToken    = CLoyaltyToken(clpTokenAddress);
        burnTracker = BurnTracker(burnTrackerAddress);

        // Fixed ETH mint prices per rarity
        rarityMintPrice[RARITY_COMMON]    = 0;              // Free
        rarityMintPrice[RARITY_RARE]      = 0.001 ether;    // 0.001 ETH
        rarityMintPrice[RARITY_EPIC]      = 0.005 ether;    // 0.005 ETH
        rarityMintPrice[RARITY_LEGENDARY] = 0.02 ether;     // 0.02 ETH
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

    /**
     * @notice Mints a badge. Requires ETH payment for RARE/EPIC/LEGENDARY.
     * Called by MINTER_ROLE (backend) — backend pays on behalf of custodial users.
     * For Web3 users, the frontend sends the transaction with msg.value.
     */
    function mint(address to, uint256 badgeTypeId, string calldata badgeUri)
        external payable onlyRole(MINTER_ROLE) whenNotPaused
    {
        require(to != address(0),                "BadgeNFT: mint to zero");
        require(balanceOf(to, badgeTypeId) == 0, "BadgeNFT: already holds badge");

        BadgeType storage bt = badgeTypes[badgeTypeId];
        uint256 requiredPrice = rarityMintPrice[bt.rarity];

        // Enforce ETH payment for paid rarities
        require(msg.value >= requiredPrice, "BadgeNFT: Insufficient payment for this rarity");

        // CLP balance checks for LEGENDARY
        if (bt.rarity == RARITY_LEGENDARY && bt.minClpBalance > 0) {
            require(clpToken.balanceOf(to) >= bt.minClpBalance, "BadgeNFT: insufficient CLP for LEGENDARY");
        }

        // CLP cost burn for EPIC/LEGENDARY
        if ((bt.rarity == RARITY_EPIC || bt.rarity == RARITY_LEGENDARY) && bt.clpCost > 0) {
            require(clpToken.balanceOf(to) >= bt.clpCost, "BadgeNFT: insufficient CLP for mint cost");
            clpToken.penaltyBurn(to, bt.clpCost, keccak256("BADGE_MINT_COST"));
            try burnTracker.recordBurn(to, bt.clpCost, 4) {} catch {}
            emit BadgeMintedWithPayment(to, badgeTypeId, bt.clpCost);
        }

        if (bytes(_badgeURIs[badgeTypeId]).length == 0) { _badgeURIs[badgeTypeId] = badgeUri; }
        _mint(to, badgeTypeId, 1, "");
        emit BadgeMinted(to, badgeTypeId, bt.rarity, block.timestamp);

        if (requiredPrice > 0) {
            emit BadgePurchased(to, badgeTypeId, msg.value);
        }

        // Refund overpayment
        if (msg.value > requiredPrice) {
            payable(msg.sender).transfer(msg.value - requiredPrice);
        }
    }

    /**
     * @notice Returns the ETH price to mint a specific badge.
     */
    function getMintPrice(uint256 badgeTypeId) external view returns (uint256) {
        return rarityMintPrice[badgeTypes[badgeTypeId].rarity];
    }

    /**
     * @notice Update ETH price for a rarity tier. Max 0.1 ETH.
     */
    function setRarityPrice(uint8 rarity, uint256 priceInWei) external onlyRole(GOVERNANCE_ROLE) {
        require(rarity <= RARITY_LEGENDARY, "BadgeNFT: invalid rarity");
        require(priceInWei <= 0.1 ether, "BadgeNFT: price exceeds maximum");
        uint256 oldPrice = rarityMintPrice[rarity];
        rarityMintPrice[rarity] = priceInWei;
        emit MintPriceUpdated(rarity, oldPrice, priceInWei);
    }

    /**
     * @notice Withdraw collected ETH from badge sales to treasury.
     */
    function withdrawFunds(address payable treasury) external onlyRole(GOVERNANCE_ROLE) {
        uint256 bal = address(this).balance;
        require(bal > 0, "BadgeNFT: no funds to withdraw");
        treasury.transfer(bal);
        emit FundsWithdrawn(treasury, bal);
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

    // Accept ETH
    receive() external payable {}
}
