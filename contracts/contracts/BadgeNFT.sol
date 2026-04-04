// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BadgeNFT
 * @notice Soulbound ERC-1155 badge contract for ChainLoyalty.
 * @dev Each badge type has its own token ID. Badges are non-transferable (soulbound).
 *      Only addresses with MINTER_ROLE can mint. Each wallet can hold at most 1 of each badge type.
 */
contract BadgeNFT is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Per-badge-type URI storage
    mapping(uint256 => string) private _badgeURIs;

    event BadgeMinted(
        address indexed recipient,
        uint256 indexed badgeTypeId,
        string uri
    );

    constructor(address admin) ERC1155("") {
        // Grant DEFAULT_ADMIN_ROLE and MINTER_ROLE to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @notice Mints a badge to a recipient wallet.
     * @dev Only callable by MINTER_ROLE. Reverts if recipient already holds this badge type.
     * @param to Recipient wallet address
     * @param badgeTypeId Unique ID for this badge type
     * @param badgeUri Metadata URI for this badge (OpenSea standard)
     */
    function mint(
        address to,
        uint256 badgeTypeId,
        string calldata badgeUri
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        // Contract-level idempotency — a wallet can only hold each badge type once
        require(
            balanceOf(to, badgeTypeId) == 0,
            "BadgeNFT: recipient already holds this badge"
        );

        // Store the URI for this badge type if not already set
        if (bytes(_badgeURIs[badgeTypeId]).length == 0) {
            _badgeURIs[badgeTypeId] = badgeUri;
        }

        _mint(to, badgeTypeId, 1, "");
        emit BadgeMinted(to, badgeTypeId, badgeUri);
    }

    /**
     * @notice Sets or updates the metadata URI for a badge type.
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     */
    function setBadgeURI(
        uint256 badgeTypeId,
        string calldata badgeUri
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bytes(badgeUri).length > 0, "BadgeNFT: URI cannot be empty");
        _badgeURIs[badgeTypeId] = badgeUri;
    }

    /**
     * @notice Returns the metadata URI for a badge type.
     * @dev Overrides ERC1155's uri() to return per-badge URIs.
     */
    function uri(uint256 badgeTypeId) public view override returns (string memory) {
        string memory badgeUri = _badgeURIs[badgeTypeId];
        require(bytes(badgeUri).length > 0, "BadgeNFT: URI not set for this badge type");
        return badgeUri;
    }

    /**
     * @notice Pauses all minting operations. Emergency stop.
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses minting operations.
     * @dev Only callable by DEFAULT_ADMIN_ROLE.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ── Soulbound: block all transfers ────────────────────────────────────────

    /**
     * @dev Overrides safeTransferFrom to make badges non-transferable (soulbound).
     *      Minting (from == address(0)) is still allowed.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        // Allow minting (from == address(0)) but block all other transfers
        require(from == address(0), "BadgeNFT: badges are soulbound and cannot be transferred");
        super.safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @dev Overrides safeBatchTransferFrom to block batch transfers.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        require(from == address(0), "BadgeNFT: badges are soulbound and cannot be transferred");
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev Prevents accidental renouncement of DEFAULT_ADMIN_ROLE which would
     *      permanently lock the contract. MINTER_ROLE can still be renounced.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public override {
        require(
            role != DEFAULT_ADMIN_ROLE,
            "BadgeNFT: cannot renounce DEFAULT_ADMIN_ROLE"
        );
        super.renounceRole(role, callerConfirmation);
    }

    /**
     * @dev Required override for AccessControl + ERC1155 interface support.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
