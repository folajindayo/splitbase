// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SplitBase.sol";

/**
 * @title SplitFactory
 * @notice Factory contract for creating and tracking SplitBase contracts
 * @dev Maintains a registry of all created splits and their owners
 */
contract SplitFactory {
    address[] public allSplits;
    mapping(address => address[]) public splitsByOwner;
    mapping(address => bool) public isSplit;

    event SplitCreated(
        address indexed splitAddress,
        address indexed owner,
        address[] recipients,
        uint256[] percentages,
        uint256 timestamp
    );

    error InvalidArrayLength();
    error PercentagesMustSumTo100();
    error InvalidRecipientAddress();
    error InvalidPercentage();

    /**
     * @notice Create a new SplitBase contract
     * @param _recipients Array of recipient addresses
     * @param _percentages Array of percentages (must sum to 100)
     * @return splitAddress The address of the newly created split contract
     */
    function createSplit(
        address[] memory _recipients,
        uint256[] memory _percentages
    ) external returns (address splitAddress) {
        // Validation
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

        // Create new split contract
        SplitBase newSplit = new SplitBase(_recipients, _percentages);
        splitAddress = address(newSplit);

        // Track the split
        allSplits.push(splitAddress);
        splitsByOwner[msg.sender].push(splitAddress);
        isSplit[splitAddress] = true;

        emit SplitCreated(
            splitAddress,
            msg.sender,
            _recipients,
            _percentages,
            block.timestamp
        );

        return splitAddress;
    }

    /**
     * @notice Get all splits created by a specific owner
     * @param owner The address of the owner
     * @return An array of split contract addresses
     */
    function getSplitsByOwner(address owner) external view returns (address[] memory) {
        return splitsByOwner[owner];
    }

    /**
     * @notice Get the total number of splits created
     */
    function getAllSplitsCount() external view returns (uint256) {
        return allSplits.length;
    }

    /**
     * @notice Get all split addresses
     */
    function getAllSplits() external view returns (address[] memory) {
        return allSplits;
    }

    /**
     * @notice Get the number of splits created by an owner
     */
    function getSplitsCountByOwner(address owner) external view returns (uint256) {
        return splitsByOwner[owner].length;
    }

    /**
     * @notice Check if an address is a valid split created by this factory
     */
    function isValidSplit(address splitAddress) external view returns (bool) {
        return isSplit[splitAddress];
    }
}

