// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTBadge is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Badge {
        string name;
        string description;
        string imageURI;
        string rarity;
    }

    mapping(uint256 => Badge) public badges;

    event BadgeMinted(uint256 indexed tokenId, address indexed recipient, string name);

    constructor() ERC721("Monniverse Badge", "MBADGE") {}

    function mintBadge(
        address recipient,
        string memory name,
        string memory description,
        string memory imageURI,
        string memory rarity
    ) external onlyOwner returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        badges[newTokenId] = Badge(name, description, imageURI, rarity);
        _mint(recipient, newTokenId);

        emit BadgeMinted(newTokenId, recipient, name);
        return newTokenId;
    }

    function getBadgeDetails(uint256 tokenId) external view returns (Badge memory) {
        require(_exists(tokenId), "Badge does not exist");
        return badges[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return badges[tokenId].imageURI;
    }
}
