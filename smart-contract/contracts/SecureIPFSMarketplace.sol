// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecureIPFSMarketplace is ERC1155, Ownable, ReentrancyGuard {
    
    uint256 public assetCount;

    struct Asset {
        uint256 id;
        uint256 price;
        string metadataCid;
        string encryptedKey;
        address creator;
        bool active;
    }

    mapping(uint256 => Asset) public assets;
    
    mapping(address => uint256) public pendingWithdrawals;

    event AssetCreated(uint256 indexed id, address indexed creator, uint256 price);
    event AccessPurchased(uint256 indexed id, address indexed buyer);
    event FundsWithdrawn(address indexed creator, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender) {}

    function createAsset(uint256 _price, string memory _metadataCid, string memory _encryptedKey) external {
        assetCount++;
        assets[assetCount] = Asset({
            id: assetCount,
            price: _price,
            metadataCid: _metadataCid,
            encryptedKey: _encryptedKey,
            creator: msg.sender,
            active: true
        });

        _mint(msg.sender, assetCount, 1, "");
        
        emit AssetCreated(assetCount, msg.sender, _price);
    }

    function buyAccess(uint256 _assetId) external payable nonReentrant {
        Asset memory asset = assets[_assetId];
        require(asset.active, "Asset does not exist or is inactive");
        require(msg.value == asset.price, "Incorrect ETH amount sent");
        require(balanceOf(msg.sender, _assetId) == 0, "You already have access");

        pendingWithdrawals[asset.creator] += msg.value;
        _mint(msg.sender, _assetId, 1, "");

        emit AccessPurchased(_assetId, msg.sender);
    }

    function getEncryptedKey(uint256 _assetId) external view returns (string memory) {
        require(balanceOf(msg.sender, _assetId) > 0, "Not authorized: Purchase NFT first");
        return assets[_assetId].encryptedKey;
    }

    function withdrawFunds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send Ether");

        emit FundsWithdrawn(msg.sender, amount);
    }
    function getAssetPublicInfo(uint256 _assetId) external view returns (uint256, uint256, string memory, address) {
        Asset memory asset = assets[_assetId];
        return (asset.id, asset.price, asset.metadataCid, asset.creator);
    }
}