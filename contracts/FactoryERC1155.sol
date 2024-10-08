// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC1155Instance.sol";

contract FactoryERC1155 is Ownable {

    address public universalMinter;
    address public universalBurner;

    string public baseURI;

    event NewInstance(string name, string symbol, address instance);

    constructor(address _universalMinter, address _universalBurner, string memory _baseURI) {
        universalMinter = _universalMinter;
        universalBurner = _universalBurner;
        baseURI = _baseURI;
    }

    function setUniversalMinter(address _universalMinter) external onlyOwner {
        universalMinter = _universalMinter;
    }

    function setUniversalBurner(address _universalBurner) external onlyOwner {
        universalBurner = _universalBurner;
    }

    function setBaseURI(string calldata _baseURi) external onlyOwner {
        baseURI = _baseURi;
    }

    function deployERC1155Instance(string memory _name, string memory _symbol) external onlyOwner {
        emit NewInstance(_name, _symbol, address(new ERC1155Instance(_name, _symbol, _msgSender())));
    }
}