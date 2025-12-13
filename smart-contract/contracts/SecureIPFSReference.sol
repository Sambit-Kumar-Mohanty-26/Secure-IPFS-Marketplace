// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

contract SecureIPFSReference {

    address public owner;
    string private encryptedCid;
    string private encryptedKey;
    string public digitalSignature;
    uint256 public accessPriceWei; 

    mapping(address => bool) private authorized;

    event AccessGranted(address indexed user);
    event PriceUpdated(uint256 newPriceWei);
    event PaymentReceived(address indexed from, uint256 amountWei);

    constructor(
        string memory _encryptedCid,
        string memory _encryptedKey,
        string memory _digitalSignature,
        uint256 _priceWei
    ) {
        owner = msg.sender;
        encryptedCid = _encryptedCid;
        encryptedKey = _encryptedKey;
        digitalSignature = _digitalSignature;
        accessPriceWei = _priceWei;
        emit PriceUpdated(_priceWei);
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setPrice(uint256 _priceWei) external onlyOwner {
        accessPriceWei = _priceWei;
        emit PriceUpdated(_priceWei);
    }

    function requestAccess() external payable {
        require(msg.value == accessPriceWei, "Incorrect payment");
        authorized[msg.sender] = true;
        emit PaymentReceived(msg.sender, msg.value);
        emit AccessGranted(msg.sender);

        (bool ok, ) = payable(owner).call{value: msg.value}("");
        require(ok, "Owner transfer failed");
    }

    function isAuthorized(address user) external view returns (bool) {
        return authorized[user] || user == owner;
    }

    function getPublicData() external view returns (string memory cid, string memory sig, uint256 price) {
        return (encryptedCid, digitalSignature, accessPriceWei);
    }

    function getEncryptedKey() external view returns (string memory) {
        require(authorized[msg.sender] || msg.sender == owner, "Not authorized");
        return encryptedKey;
    }
}