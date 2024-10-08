// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IFactoryERC721.sol";

contract ERC721Instance is ERC721Enumerable, ERC721Burnable, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    IFactoryERC721 public factory;
    bool public claimable;

    uint256 public totalIDs;

    mapping(uint256 => bool) public mintIDUsed;
    mapping(uint256 => bool) public claimed;
    mapping(uint256 => bool) public claimIDUsed;

    event Correlate(uint256[] mintID, uint256 totalIDs, address[] account);
    event Claim(uint256 tokenID, address account);

    constructor(string memory _name, string memory _symbol, address admin, bool _claimable) ERC721(_name, _symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(BURNER_ROLE, admin);
        factory = IFactoryERC721(_msgSender());
        claimable = _claimable;
    }

    function mint(uint256[] calldata mintID, address[] calldata account) external {
        require(hasRole(MINTER_ROLE, _msgSender()) || _msgSender() == factory.universalMinter(), "Not authorized for mint");
        require(mintID.length == account.length, "Non-matching length");
        for (uint256 i; i < mintID.length; i++) {
            require(!mintIDUsed[mintID[i]], "Mint ID already used");
            mintIDUsed[mintID[i]] = true;
            _safeMint(account[i], totalIDs);
            totalIDs++;
        }
        emit Correlate(mintID, totalIDs, account);
    }

    function claim(uint256 claimID, uint256 tokenID, uint256 deadline, bytes calldata signature) external {
        require(claimable, "This collection is not claimable");
        require(factory.signer() == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(block.chainid, claimID, _msgSender(), address(this), tokenID, deadline))), signature), "Invalid signature");
        require(!claimIDUsed[claimID], "Claim ID used");
        claimIDUsed[claimID] = true;
        require(!claimed[tokenID], "Already claimed");
        claimed[tokenID] = true;
        require(deadline >= block.timestamp, "Deadline passed");
        require(ownerOf(tokenID) == _msgSender(), "Not an owner");
        emit Claim(tokenID, _msgSender());
    }

    function burn(uint256 tokenId) public override {
        require(hasRole(BURNER_ROLE, _msgSender()) || _msgSender() == factory.universalBurner(), "Not authorized for burn");
        ERC721Burnable.burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, AccessControl) returns (bool) {
        return ERC721.supportsInterface(interfaceId) || ERC721Enumerable.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function _baseURI() internal view override returns (string memory) {
        return string.concat(factory.baseURI(), Strings.toString(block.chainid), "/", Strings.toHexString(uint256(uint160(address(this))), 20), "/");
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        ERC721Enumerable._beforeTokenTransfer(from, to, tokenId);
    }
}