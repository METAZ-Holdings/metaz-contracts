// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PaymentGetter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public signer;

    mapping(uint8 => mapping(uint256 => bool)) public paymentIDUsed;

    event GotPayment(uint8 paymentType, uint256 paymentID);

    constructor(address _signer) {
        signer = _signer;
    }

    function doPayment(uint8 paymentType, uint256 paymentID, address token, uint256 amount, uint256 deadline, bytes calldata signature) external payable nonReentrant {
        require(signer == ECDSA.recover(ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(block.chainid, paymentType, paymentID, _msgSender(), address(this), token, amount, deadline))), signature), "Invalid signature");
        require(deadline >= block.timestamp, "Deadline passed");
        require(!paymentIDUsed[paymentType][paymentID], "Payment ID used");
        paymentIDUsed[paymentType][paymentID] = true;
        if (token == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            require(msg.value == amount, "Wrong payment amount");
            payable(owner()).transfer(msg.value);
        }
        else {
            require(msg.value == 0, "Cannot send native currency while paying with token");
            IERC20(token).safeTransferFrom(_msgSender(), owner(), amount);
        }
        emit GotPayment(paymentType, paymentID);
    }

    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
    }
}