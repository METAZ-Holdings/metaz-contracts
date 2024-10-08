// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract token is ERC20Burnable {

    constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol) {

    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}