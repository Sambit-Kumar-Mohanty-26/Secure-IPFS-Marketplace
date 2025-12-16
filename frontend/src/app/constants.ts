export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // YOUR NEW ADDRESS

export const ABI = [
  // --- WRITE FUNCTIONS ---
  "function createAsset(uint256 price, string metadataCid, string encryptedKey) external",
  "function withdrawFunds() external",
  "function buyAccess(uint256 assetId) external payable",
  
  // --- READ FUNCTIONS ---
  "function getAssetPublicInfo(uint256 assetId) external view returns (uint256 id, uint256 price, string metadataCid, address creator)",
  "function getEncryptedKey(uint256 assetId) external view returns (string)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function assetCount() external view returns (uint256)",
  "function pendingWithdrawals(address user) external view returns (uint256)",

  // --- EVENTS ---
  "event AssetCreated(uint256 indexed id, address indexed creator, uint256 price)",
  "event AccessPurchased(uint256 indexed id, address indexed buyer)",
  "event FundsWithdrawn(address indexed creator, uint256 amount)"
];