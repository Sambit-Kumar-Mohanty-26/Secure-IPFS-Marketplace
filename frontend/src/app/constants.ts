export const CONTRACT_ADDRESS = "0x80D9E9D71d7052304CA57B8c80CcAE2d5162d8A0";

export const ABI = [
  // --- WRITE FUNCTIONS ---
  "function createAsset(uint256 price, string metadataCid, string encryptedKey, uint256 maxSupply, uint96 royaltyPercent) external",
  "function withdrawFunds() external",
  "function buyAccess(uint256 assetId) external payable",
  "function toggleAssetStatus(uint256 assetId) external",
  
  // --- READ FUNCTIONS ---
  "function getAssetPublicInfo(uint256 assetId) external view returns (uint256 id, uint256 price, string metadataCid, address creator, bool active, uint256 maxSupply, uint256 currentSupply, uint96 royaltyBasisPoints)",
  "function getEncryptedKey(uint256 assetId) external view returns (string)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function assetCount() external view returns (uint256)",
  "function pendingWithdrawals(address user) external view returns (uint256)",
  "function assets(uint256 id) external view returns (uint256 id, uint256 price, string metadataCid, string encryptedKey, address creator, bool active, uint256 maxSupply, uint256 currentSupply, uint96 royaltyBasisPoints)",

  // --- EVENTS ---
  "event AssetCreated(uint256 indexed id, address indexed creator, uint256 price, uint256 maxSupply)",
  "event AccessPurchased(uint256 indexed id, address indexed buyer)",
  "event FundsWithdrawn(address indexed creator, uint256 amount)"
];