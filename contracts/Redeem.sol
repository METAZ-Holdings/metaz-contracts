// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IERC721Burnable.sol";
import "./interfaces/IERC1155Burnable.sol";

contract Redeem is ERC721Holder, ERC1155Holder, AccessControl, ReentrancyGuard {

    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    uint256 public counter;

    struct RedeemInfo {
        bool processed;
        address sender;
        address instance;
        uint256[2] idAndAmount;
    }

    mapping(uint256 => bool) public orderIDUsed;
    mapping(uint256 => RedeemInfo) public redeemInfo;

    event NewRedeem(uint256 indexed ID, uint256 orderID, address sender, address instance, uint256[2] idAndAmount);
    event RedeemProcessed(uint256 indexed ID, bool accepted);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function createRedeem(uint256 orderID, address instance, uint256[2] calldata idAndAmount, uint256 deadline, bytes calldata signature) external nonReentrant {
        require(hasRole(SIGNER_ROLE, ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(block.chainid, orderID, _msgSender(), address(this), instance, idAndAmount, deadline))), signature)), "Invalid signature");
        require(deadline >= block.timestamp, "Deadline passed");
        require(!orderIDUsed[orderID], "Order ID already used");
        orderIDUsed[orderID] = true;
        if (idAndAmount[1] == 0) {
            IERC721(instance).safeTransferFrom(_msgSender(), address(this), idAndAmount[0]);
        }
        else {
            IERC1155(instance).safeTransferFrom(_msgSender(), address(this), idAndAmount[0], idAndAmount[1], "");
        }
        redeemInfo[counter] = RedeemInfo(false, _msgSender(), instance, idAndAmount);
        emit NewRedeem(counter, orderID, _msgSender(), instance, idAndAmount);
        counter++;
    }

    function processRedeem(uint256 id, bool accepted) external onlyRole(SIGNER_ROLE) {
        require(id < counter, "ID does not exist");
        require(!redeemInfo[id].processed, "Already processed");
        redeemInfo[id].processed = true;
        if (accepted) {
            if (redeemInfo[id].idAndAmount[1] == 0) {
                IERC721Burnable(redeemInfo[id].instance).burn(redeemInfo[id].idAndAmount[0]);
            }
            else {
                IERC1155Burnable(redeemInfo[id].instance).burn(address(this), redeemInfo[id].idAndAmount[0], redeemInfo[id].idAndAmount[1]);
            }
        }
        else {
            if (redeemInfo[id].idAndAmount[1] == 0) {
                IERC721(redeemInfo[id].instance).safeTransferFrom(address(this), redeemInfo[id].sender, redeemInfo[id].idAndAmount[0]);
            }
            else {
                IERC1155(redeemInfo[id].instance).safeTransferFrom(address(this), redeemInfo[id].sender, redeemInfo[id].idAndAmount[0], redeemInfo[id].idAndAmount[1], "");
            }
        }
        emit RedeemProcessed(id, accepted);
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155Receiver) returns(bool) {
        return AccessControl.supportsInterface(interfaceId) || ERC1155Receiver.supportsInterface(interfaceId);
    }
}