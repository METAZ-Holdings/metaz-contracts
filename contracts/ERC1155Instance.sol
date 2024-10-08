// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IFactoryERC1155.sol";

contract ERC1155Instance is ERC1155Supply, ERC1155Burnable, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    IFactoryERC1155 public factory;

    string public name;
    string public symbol;

    uint256 public totalIDs;

    mapping(uint256 => bool) public mintIDUsed;

    event Correlate(uint256[] mintID, uint256 totalIDs, address[] to, uint256[] amount);
    event Mint(address[] to, uint256[] id, uint256[] amount);

    constructor(string memory _name, string memory _symbol, address admin) ERC1155("") {
        name = _name;
        symbol = _symbol;
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        _setupRole(BURNER_ROLE, admin);
        factory = IFactoryERC1155(_msgSender());
    }

    function createNewToken(uint256[] calldata mintID, address[] calldata to, uint256[] calldata amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()) || _msgSender() == factory.universalMinter(), "Not authorized for mint");
        require(mintID.length == to.length && mintID.length == amount.length, "Non-matching length");
        for (uint256 i; i < mintID.length; i++) {
            require(!mintIDUsed[mintID[i]], "Mint ID already used");
            mintIDUsed[mintID[i]] = true;
            if (amount[i] > 0) {
                _mint(to[i], totalIDs, amount[i], "");
            }
            totalIDs++;
        }
        emit Correlate(mintID, totalIDs, to, amount);
    }

    function mint(address[] calldata to, uint256[] calldata id, uint256[] calldata amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()) || _msgSender() == factory.universalMinter(), "Not authorized for mint");
        require(to.length == id.length && to.length == amount.length, "Non-matching length");
        for (uint256 i; i < to.length; i++) {
            require(id[i] < totalIDs, "Mint for nonexisting token");
            _mint(to[i], id[i], amount[i], "");
        }
        emit Mint(to, id, amount);
    }

    function burn(address account, uint256 id, uint256 value) public override {
        require(hasRole(BURNER_ROLE, _msgSender()) || _msgSender() == factory.universalBurner(), "Not authorized for burn");
        ERC1155Burnable.burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public override {
        require(hasRole(BURNER_ROLE, _msgSender()) || _msgSender() == factory.universalBurner(), "Not authorized for burn");
        ERC1155Burnable.burnBatch(account, ids, values);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string.concat(factory.baseURI(), Strings.toString(block.chainid), "/", Strings.toHexString(uint256(uint160(address(this))), 20), "/", Strings.toString(tokenId));
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return ERC1155.supportsInterface(interfaceId) || AccessControl.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal override(ERC1155, ERC1155Supply) {
        ERC1155Supply._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}