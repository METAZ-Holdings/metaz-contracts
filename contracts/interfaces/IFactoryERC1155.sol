// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IFactoryERC1155 {

    function universalMinter() external view returns(address);

    function universalBurner() external view returns(address);

    function baseURI() external view returns(string memory);
}