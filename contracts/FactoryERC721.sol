// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721Instance.sol";

contract FactoryERC721 is Ownable {

    address public signer;
    address public universalMinter;
    address public universalBurner;

    string public baseURI;

    event NewInstance(string name, string symbol, bool claimable, address instance);

    constructor(address _signer, address _universalMinter, address _universalBurner, string memory _baseURI) {
        signer = _signer;
        universalMinter = _universalMinter;
        universalBurner = _universalBurner;
        baseURI = _baseURI;
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
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

    function deployERC721Instance(string memory _name, string memory _symbol, bool claimable) external onlyOwner {
        emit NewInstance(_name, _symbol, claimable, address(new ERC721Instance(_name, _symbol, _msgSender(), claimable)));
    }
}