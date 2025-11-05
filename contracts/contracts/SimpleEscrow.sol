// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleEscrow
 * @dev Simple escrow contract that holds funds until buyer approves release
 */
contract SimpleEscrow is ReentrancyGuard, Ownable {
    address public buyer;
    address public seller;
    uint256 public amount;
    bool public isDeposited;
    bool public isReleased;
    bool public isRefunded;
    uint256 public releaseTime;
    bool public autoRelease;

    event Deposited(address indexed buyer, uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event Refunded(address indexed buyer, uint256 amount);
    event AutoReleaseEnabled(uint256 releaseTime);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        uint256 _amount,
        uint256 _releaseTime,
        bool _autoRelease
    ) {
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        require(_amount > 0, "Amount must be greater than 0");

        buyer = _buyer;
        seller = _seller;
        amount = _amount;
        releaseTime = _releaseTime;
        autoRelease = _autoRelease;

        if (_autoRelease && _releaseTime > 0) {
            emit AutoReleaseEnabled(_releaseTime);
        }
    }

    /**
     * @dev Buyer deposits funds into escrow
     */
    function deposit() external payable onlyBuyer nonReentrant {
        require(!isDeposited, "Already deposited");
        require(msg.value == amount, "Incorrect amount");

        isDeposited = true;
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Buyer releases funds to seller
     */
    function release() external onlyBuyer nonReentrant {
        require(isDeposited, "Not yet deposited");
        require(!isReleased, "Already released");
        require(!isRefunded, "Already refunded");

        isReleased = true;
        payable(seller).transfer(amount);
        emit Released(seller, amount);
    }

    /**
     * @dev Auto-release funds after time lock expires
     */
    function autoReleaseAfterTimelock() external nonReentrant {
        require(isDeposited, "Not yet deposited");
        require(!isReleased, "Already released");
        require(!isRefunded, "Already refunded");
        require(autoRelease, "Auto-release not enabled");
        require(releaseTime > 0, "No release time set");
        require(block.timestamp >= releaseTime, "Time lock not expired");

        isReleased = true;
        payable(seller).transfer(amount);
        emit Released(seller, amount);
    }

    /**
     * @dev Refund to buyer (only contract owner/platform can call)
     */
    function refund() external onlyOwner nonReentrant {
        require(isDeposited, "Not yet deposited");
        require(!isReleased, "Already released");
        require(!isRefunded, "Already refunded");

        isRefunded = true;
        payable(buyer).transfer(amount);
        emit Refunded(buyer, amount);
    }

    /**
     * @dev Check if time lock has expired
     */
    function isTimeLockExpired() external view returns (bool) {
        if (releaseTime == 0) return false;
        return block.timestamp >= releaseTime;
    }

    /**
     * @dev Get escrow status
     */
    function getStatus() external view returns (
        bool _isDeposited,
        bool _isReleased,
        bool _isRefunded,
        uint256 _balance
    ) {
        return (isDeposited, isReleased, isRefunded, address(this).balance);
    }
}

