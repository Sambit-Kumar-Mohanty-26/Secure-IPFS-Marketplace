// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract SecureIPFSMarketplace is ERC1155, Ownable, ReentrancyGuard, ERC2981 {
    
    uint256 public assetCount;

    struct Asset {
        uint256 id;
        uint256 price;
        string metadataCid;
        string encryptedKey;
        address creator;
        bool active;
        uint256 maxSupply;
        uint256 currentSupply;
        uint96 royaltyBasisPoints;
    }

    mapping(uint256 => Asset) public assets;
    
    mapping(address => uint256) public pendingWithdrawals;

    event AssetCreated(uint256 indexed id, address indexed creator, uint256 price, uint256 maxSupply);
    event AccessPurchased(uint256 indexed id, address indexed buyer);
    event FundsWithdrawn(address indexed creator, uint256 amount);

    constructor() ERC1155("") Ownable(msg.sender) {}

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function createAsset(uint256 _price, string memory _metadataCid, string memory _encryptedKey, uint256 _maxSupply,  uint96 _royaltyPercent) external {
        require(_maxSupply > 0, "Max supply must be at least 1");
        require(_royaltyPercent <= 100, "Royalty cannot exceed 100%");
        assetCount++;
        uint96 feeNumerator = _royaltyPercent * 100;
        assets[assetCount] = Asset({
            id: assetCount,
            price: _price,
            metadataCid: _metadataCid,
            encryptedKey: _encryptedKey,
            creator: msg.sender,
            active: true,
            maxSupply: _maxSupply,
            currentSupply: 1,
            royaltyBasisPoints: feeNumerator
        });

        _setTokenRoyalty(assetCount, msg.sender, feeNumerator);


        _mint(msg.sender, assetCount, 1, "");
        
        emit AssetCreated(assetCount, msg.sender, _price, _maxSupply);
    }

    function buyAccess(uint256 _assetId) external payable nonReentrant {
        Asset storage asset = assets[_assetId];
        require(asset.active, "Asset does not exist or is inactive");
        require(msg.value == asset.price, "Incorrect ETH amount sent");
        require(balanceOf(msg.sender, _assetId) == 0, "You already have access");
        require(asset.currentSupply < asset.maxSupply, "SOLD OUT: Edition limit reached");

        asset.currentSupply++;

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
    function getAssetPublicInfo(uint256 _assetId) external view returns (
        uint256 id, 
        uint256 price, 
        string memory metadataCid, 
        address creator, 
        bool active, 
        uint256 maxSupply, 
        uint256 currentSupply,
        uint96 royaltyBasisPoints
    ) {
        Asset memory asset = assets[_assetId];
        return (
            asset.id, 
            asset.price, 
            asset.metadataCid, 
            asset.creator, 
            asset.active, 
            asset.maxSupply, 
            asset.currentSupply,
            asset.royaltyBasisPoints
        );
    }

    function toggleAssetStatus(uint256 _assetId) external {
        require(assets[_assetId].creator == msg.sender, "Only creator can modify");
        assets[_assetId].active = !assets[_assetId].active;
    }
}