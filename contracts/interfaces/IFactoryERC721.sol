// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

interface IFactoryERC721 {

    function signer() external view returns(address);

    function universalMinter() external view returns(address);

    function universalBurner() external view returns(address);

    function baseURI() external view returns(string memory);
}