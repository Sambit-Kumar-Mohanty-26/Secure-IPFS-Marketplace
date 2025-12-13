export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const ABI = [
  "function requestAccess() external payable",
  "function getPublicData() external view returns (string memory cid, string memory sig, uint256 price)",
  "function getEncryptedKey() external view returns (string memory)",
  "function isAuthorized(address user) external view returns (bool)",
  "event AccessGranted(address indexed user)"
];