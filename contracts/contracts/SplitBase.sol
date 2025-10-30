// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SplitBase
 * @notice A contract that automatically splits received ETH among multiple recipients
 * @dev Uses ReentrancyGuard to prevent reentrancy attacks during distribution
 */
contract SplitBase is ReentrancyGuard {
    address[] public recipients;
    uint256[] public percentages;
    address public immutable owner;
    uint256 public totalDistributed;

    event FundsReceived(address indexed from, uint256 amount);
    event FundsDistributed(uint256 amount, uint256 timestamp);
    event RecipientPaid(address indexed recipient, uint256 amount);

    error InvalidArrayLength();
    error PercentagesMustSumTo100();
    error InvalidRecipientAddress();
    error InvalidPercentage();
    error NoFundsToDistribute();
    error TransferFailed();

    /**
     * @notice Creates a new split contract
     * @param _recipients Array of recipient addresses
     * @param _percentages Array of percentages (must sum to 100)
     */
    constructor(address[] memory _recipients, uint256[] memory _percentages) {
        if (_recipients.length == 0 || _recipients.length != _percentages.length) {
            revert InvalidArrayLength();
        }

        uint256 total = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_recipients[i] == address(0)) {
                revert InvalidRecipientAddress();
            }
            if (_percentages[i] == 0) {
                revert InvalidPercentage();
            }
            total += _percentages[i];
        }

        if (total != 100) {
            revert PercentagesMustSumTo100();
        }

        recipients = _recipients;
        percentages = _percentages;
        owner = msg.sender;
    }

    /**
     * @notice Automatically distributes received ETH
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
        if (msg.value > 0) {
            _distribute();
        }
    }

    /**
     * @notice Manually trigger distribution of contract balance
     */
    function distribute() external nonReentrant {
        _distribute();
    }

    /**
     * @notice Internal function to distribute funds to recipients
     */
    function _distribute() private {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert NoFundsToDistribute();
        }

        uint256 remaining = balance;
        
        // Distribute to all recipients except the last one
        for (uint256 i = 0; i < recipients.length - 1; i++) {
            uint256 share = (balance * percentages[i]) / 100;
            remaining -= share;
            
            (bool success, ) = payable(recipients[i]).call{value: share}("");
            if (!success) {
                revert TransferFailed();
            }
            
            emit RecipientPaid(recipients[i], share);
        }

        // Send remaining balance to last recipient (handles rounding dust)
        if (remaining > 0) {
            (bool success, ) = payable(recipients[recipients.length - 1]).call{value: remaining}("");
            if (!success) {
                revert TransferFailed();
            }
            
            emit RecipientPaid(recipients[recipients.length - 1], remaining);
        }

        totalDistributed += balance;
        emit FundsDistributed(balance, block.timestamp);
    }

    /**
     * @notice Get the number of recipients
     */
    function getRecipientsCount() external view returns (uint256) {
        return recipients.length;
    }

    /**
     * @notice Get all recipients and their percentages
     */
    function getSplitDetails() 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        return (recipients, percentages);
    }

    /**
     * @notice Get a specific recipient and percentage
     */
    function getRecipient(uint256 index) 
        external 
        view 
        returns (address recipient, uint256 percentage) 
    {
        require(index < recipients.length, "Index out of bounds");
        return (recipients[index], percentages[index]);
    }
}

