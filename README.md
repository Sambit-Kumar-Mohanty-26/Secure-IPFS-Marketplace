# 🔐 Secure IPFS Marketplace

A decentralized marketplace for buying and selling encrypted digital assets stored on IPFS with blockchain-based access control. Built with Next.js 16, Solidity 0.8.28, and Hardhat, featuring ERC1155 NFT tokens for access management and AES-256-GCM encryption for content security.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Smart Contract Features](#smart-contract-features)
- [Frontend Features](#frontend-features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Security Features](#security-features)
- [Testing](#testing)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Secure IPFS Marketplace is a **Web3 decentralized application (dApp)** that enables creators to monetize their digital content through blockchain technology. The platform combines:

- **IPFS (InterPlanetary File System)** for decentralized file storage
- **AES-256-GCM encryption** for content protection
- **ERC1155 multi-token standard** for access control
- **ERC2981 royalty standard** for creator royalties
- **Ethereum blockchain** for transparent transactions
- **Next.js 16** for a modern, responsive frontend

### Core Concept

1. **Creators** upload encrypted files to IPFS and mint ERC1155 NFTs that grant access
2. **Buyers** purchase NFTs with ETH to unlock encrypted content
3. **Smart Contract** manages access control and automatic royalty distribution
4. **Encryption keys** are stored on-chain but only accessible to NFT holders

---

## ✨ Key Features

### 🎨 **For Creators**
- Upload and encrypt digital assets (images, videos, documents, 3D models)
- Set custom pricing in ETH
- Define limited edition supply (1 to unlimited)
- Configure royalty percentages (0-100%)
- Withdraw earnings instantly
- Toggle asset visibility (active/inactive)
- Track total sales and supply

### 🛒 **For Buyers**
- Browse marketplace with 3D visual effects
- Purchase access via MetaMask wallet
- Instant content decryption after purchase
- ERC1155 NFT as proof of ownership
- One-time purchase for permanent access
- Sold-out detection for limited editions

### 🔒 **Security Features**
- AES-256-GCM client-side encryption
- On-chain encrypted key storage
- Reentrancy protection (ReentrancyGuard)
- Access control via NFT balance checks
- Pull payment pattern for withdrawals
- OpenZeppelin security libraries

### 🌐 **Blockchain Features**
- ERC1155 multi-token standard
- ERC2981 royalty implementation
- Event emission for all critical actions
- Gas-optimized operations
- Sepolia testnet & localhost support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│          (Next.js 16 + React 19 + Three.js)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Wallet Integration                          │
│         (MetaMask via ethers.js v6)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Smart Contract Layer                           │
│    SecureIPFSMarketplace.sol (ERC1155 + ERC2981)       │
│  - Asset Creation  - Purchase Logic  - Royalties       │
│  - Access Control  - Withdrawals     - Events          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Ethereum Blockchain                         │
│        (Sepolia Testnet / Local Hardhat)                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          Decentralized Storage (IPFS)                    │
│    - Encrypted Asset Files  - Metadata (JSON)           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Asset Creation:**
   ```
   Creator → Upload File → Encrypt (AES-256) → IPFS Upload → 
   Smart Contract (store metadata + encrypted key) → Mint ERC1155 NFT
   ```

2. **Asset Purchase:**
   ```
   Buyer → Send ETH → Smart Contract Verification → 
   Mint NFT to Buyer → Funds to Creator's Pending Withdrawals
   ```

3. **Content Access:**
   ```
   NFT Holder → Request Encrypted Key → Smart Contract Validates Ownership → 
   Return Key → Decrypt Content → Display to User
   ```

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.10 | React framework with App Router |
| React | 19.2.1 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Utility-first styling |
| ethers.js | ^6.16.0 | Ethereum interaction |
| Three.js | ^0.182.0 | 3D graphics |
| @react-three/fiber | ^9.4.2 | React renderer for Three.js |
| @react-three/drei | ^10.7.7 | Three.js helpers |
| Framer Motion | ^12.23.26 | Animations |
| Lucide React | ^0.561.0 | Icon library |

### **Smart Contract**
| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | 0.8.28 | Smart contract language |
| Hardhat | ^2.22.3 | Development environment |
| OpenZeppelin Contracts | ^5.4.0 | Secure contract libraries |
| ethers.js | ^6.11.1 | Contract interaction |
| TypeChain | Included | TypeScript bindings |
| Hardhat Toolbox | ^5.0.0 | Testing & deployment |
| dotenv | ^16.6.1 | Environment management |

### **Standards Implemented**
- **ERC1155**: Multi-token standard for flexible NFT supply
- **ERC2981**: On-chain royalty standard
- **ERC165**: Interface detection

---

## 📁 Project Structure

```
Secure-IPFS-Marketplace/
│
├── frontend/                          # Next.js Frontend Application
│   ├── src/
│   │   └── app/
│   │       ├── admin/
│   │       │   └── create/           # Asset creation page
│   │       │       └── page.tsx
│   │       ├── components/
│   │       │   └── Scene.tsx         # 3D Three.js scene
│   │       ├── utils/
│   │       │   └── encryption.ts     # AES-256 encryption utilities
│   │       ├── constants.ts          # Contract ABI & address
│   │       ├── globals.css           # Global styles
│   │       ├── layout.tsx            # Root layout
│   │       └── page.tsx              # Marketplace homepage (33KB)
│   ├── public/                       # Static assets
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   ├── README.md
│   └── tsconfig.json
│
├── smart-contract/                    # Hardhat Smart Contract Project
│   ├── contracts/
│   │   └── SecureIPFSMarketplace.sol # Main marketplace contract (4KB)
│   ├── ignition/
│   │   └── modules/
│   │       ├── Marketplace.ts        # Deployment module
│   │       └── SecureIPFS.ts         # Primary deployment script
│   ├── scripts/
│   │   └── prepare-file.ts           # Asset preparation utility
│   ├── test/                         # Contract test files
│   ├── typechain-types/              # Generated TypeScript types
│   ├── .gitignore
│   ├── encrypted-assets.txt          # Sample encrypted data (364KB)
│   ├── hardhat.config.ts             # Hardhat configuration
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── tsconfig.json
│
├── design.pdf                         # Project design documentation (182KB)
├── .gitignore
└── README.md                          # This file
```

---

## 📜 Smart Contract Features

### **SecureIPFSMarketplace.sol**

#### Inheritance Structure
```solidity
SecureIPFSMarketplace
  ├── ERC1155 (Multi-token NFT standard)
  ├── Ownable (Access control)
  ├── ReentrancyGuard (Security)
  └── ERC2981 (Royalty standard)
```

#### Core Functions

##### **Write Functions**

1. **`createAsset()`**
   ```solidity
   function createAsset(
       uint256 _price,
       string memory _metadataCid,
       string memory _encryptedKey,
       uint256 _maxSupply,
       uint96 _royaltyPercent
   ) external
   ```
   - Creates new digital asset listing
   - Mints first NFT to creator
   - Sets royalty configuration
   - Emits: `AssetCreated(id, creator, price, maxSupply)`
   - Requirements:
     - `_maxSupply > 0`
     - `_royaltyPercent <= 100`

2. **`buyAccess()`**
   ```solidity
   function buyAccess(uint256 _assetId) external payable nonReentrant
   ```
   - Purchases access to asset
   - Mints NFT to buyer
   - Adds funds to creator's withdrawal balance
   - Emits: `AccessPurchased(id, buyer)`
   - Requirements:
     - Asset must be active
     - Correct ETH amount sent
     - Buyer doesn't already own NFT
     - Supply not exhausted

3. **`withdrawFunds()`**
   ```solidity
   function withdrawFunds() external nonReentrant
   ```
   - Withdraws accumulated earnings
   - Uses pull payment pattern
   - Emits: `FundsWithdrawn(creator, amount)`
   - Requirements:
     - Must have pending withdrawals > 0

4. **`toggleAssetStatus()`**
   ```solidity
   function toggleAssetStatus(uint256 _assetId) external
   ```
   - Activates/deactivates asset listing
   - Creator-only function
   - Requirements:
     - Caller must be asset creator

##### **Read Functions**

1. **`getAssetPublicInfo()`**
   - Returns: id, price, metadataCid, creator, active, maxSupply, currentSupply, royaltyBasisPoints
   - Public information accessible to all

2. **`getEncryptedKey()`**
   - Returns: encrypted decryption key
   - **Access-controlled**: Caller must own NFT
   - Enables content decryption

3. **`balanceOf()`**
   - ERC1155 standard function
   - Checks NFT ownership

4. **`assetCount()`**
   - Total number of assets created

5. **`pendingWithdrawals()`**
   - Check withdrawal balance by address

#### Asset Structure
```solidity
struct Asset {
    uint256 id;                    // Unique identifier
    uint256 price;                 // Price in wei
    string metadataCid;           // IPFS CID for metadata
    string encryptedKey;          // AES-256 encryption key (encrypted)
    address creator;              // Creator's wallet address
    bool active;                  // Listing status
    uint256 maxSupply;            // Maximum NFTs mintable
    uint256 currentSupply;        // Current NFTs minted
    uint96 royaltyBasisPoints;   // Royalty in basis points (100 = 1%)
}
```

#### Events
```solidity
event AssetCreated(uint256 indexed id, address indexed creator, uint256 price, uint256 maxSupply);
event AccessPurchased(uint256 indexed id, address indexed buyer);
event FundsWithdrawn(address indexed creator, uint256 amount);
```

#### Security Mechanisms
- ✅ **ReentrancyGuard**: Prevents reentrancy attacks on `buyAccess()` and `withdrawFunds()`
- ✅ **Access Control**: Only NFT owners can decrypt content
- ✅ **Pull Payment**: Creators withdraw funds themselves (prevents push payment vulnerabilities)
- ✅ **Ownership Validation**: Creator-only functions enforced
- ✅ **Supply Limits**: Enforces edition limits (prevents overselling)
- ✅ **OpenZeppelin Libraries**: Battle-tested security implementations

---

## 🎨 Frontend Features

### **Main Marketplace (`page.tsx`)**

#### Components
1. **Navigation Bar**
   - Brand logo
   - Wallet connection button with address display
   - Responsive hamburger menu

2. **Hero Section**
   - 3D animated background (Three.js)
   - Animated gradient text effects
   - Call-to-action buttons
   - Particle system

3. **Asset Grid**
   - Card-based layout
   - Asset thumbnails (IPFS gateway links)
   - Price display (ETH)
   - Supply tracking (current/max)
   - Sold out indicators
   - Creator addresses
   - Interactive hover effects

4. **Purchase Flow**
   - Modal dialogs for confirmations
   - Transaction status feedback
   - Error handling with user-friendly messages
   - Loading states

#### State Management
```typescript
// Core State
const [account, setAccount] = useState<string | null>(null);
const [assets, setAssets] = useState<Asset[]>([]);
const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
const [contract, setContract] = useState<ethers.Contract | null>(null);
```

#### Key Functions

1. **`connectWallet()`**
   - Requests MetaMask connection
   - Initializes ethers provider
   - Creates contract instance
   - Loads user assets

2. **`loadAssets()`**
   - Fetches all assets from contract
   - Retrieves metadata from IPFS
   - Updates UI with asset data

3. **`buyAsset()`**
   - Validates purchase conditions
   - Sends ETH transaction
   - Waits for confirmation
   - Updates asset ownership

4. **`decryptContent()`**
   - Retrieves encrypted key from contract
   - Performs AES-256-GCM decryption
   - Downloads/displays content

### **Asset Creation (`admin/create/page.tsx`)**

#### Features
- File upload with drag-and-drop
- Real-time file preview
- Price input (ETH)
- Supply configuration
- Royalty percentage slider
- Metadata form (title, description, tags)

#### Creation Workflow
```typescript
1. Select file → 2. Generate AES key → 3. Encrypt file →
4. Upload to IPFS → 5. Create metadata JSON → 6. Upload metadata →
7. Call createAsset() → 8. Mint NFT → 9. Success confirmation
```

### **3D Scene Component (`components/Scene.tsx`)**

#### Features
- Interactive 3D environment
- Animated meshes and geometries
- Camera controls
- Lighting effects (ambient, directional, point lights)
- Post-processing effects
- Responsive canvas sizing

#### Technologies
- **Three.js**: Core 3D engine
- **@react-three/fiber**: React integration
- **@react-three/drei**: Helper components (OrbitControls, Environment)

### **Encryption Utilities (`utils/encryption.ts`)**

#### Functions

1. **`generateKey()`**
   ```typescript
   async function generateKey(): Promise<string>
   ```
   - Generates 256-bit AES-GCM key
   - Uses Web Crypto API
   - Returns hex-encoded key

2. **`encryptFile()`**
   ```typescript
   async function encryptFile(file: File, keyHex: string): Promise<Uint8Array>
   ```
   - Encrypts file with AES-256-GCM
   - Prepends 12-byte IV to ciphertext
   - Returns combined byte array

3. **`decryptFile()`** (Implementation expected)
   - Extracts IV from encrypted data
   - Decrypts using AES-GCM
   - Returns original file data

---

## 🔧 Prerequisites

### Required Software
- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **MetaMask**: Browser extension ([Install](https://metamask.io/))

### Accounts & Services
- **Alchemy Account**: For Sepolia RPC URL ([Sign up](https://www.alchemy.com/))
- **Ethereum Wallet**: With Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com/))
- **IPFS Gateway Access**: Public gateways or private node

### Recommended Tools
- **VS Code**: Code editor with Solidity extensions
- **Hardhat**: Command-line tools
- **Ganache** (Optional): Local blockchain GUI

---

## 📥 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Sambit-Kumar-Mohanty-26/Secure-IPFS-Marketplace.git
cd Secure-IPFS-Marketplace
```

### 2. Smart Contract Setup

#### Install Dependencies
```bash
cd smart-contract
npm install
```

#### Configure Environment
Create `.env` file in `smart-contract/` directory:
```env
# Alchemy Sepolia RPC URL
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key for deployment (WITHOUT 0x prefix)
SEPOLIA_PRIVATE_KEY=your_private_key_here

# Note: Never commit .env file to Git!
```

#### Compile Contracts
```bash
npm run compile
```
Expected output:
```
Compiled 1 Solidity file successfully
```

#### Run Tests
```bash
npm run test
```
Tests should verify:
- ✅ Asset creation
- ✅ Access purchase flow
- ✅ Withdrawal mechanism
- ✅ Access control
- ✅ Supply limits
- ✅ Royalty calculations

### 3. Frontend Setup

#### Install Dependencies
```bash
cd ../frontend
npm install
```

#### Configure Contract Address
After deploying the contract, update `frontend/src/app/constants.ts`:
```typescript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

#### Configure Next.js (Optional)
Edit `frontend/next.config.ts` if needed:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'], // IPFS gateways
  },
};

export default nextConfig;
```

---

## 🚀 Running the Application

### Local Development Workflow

#### Step 1: Start Local Blockchain
```bash
cd smart-contract
npx hardhat node
```
This starts a local Ethereum node on `http://127.0.0.1:8545` with 20 test accounts.

**Keep this terminal running!**

#### Step 2: Deploy Contract
In a **new terminal**:
```bash
cd smart-contract
npm run deploy
```

Expected output:
```
Deploying SecureIPFSMarketplace...
Contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy the contract address** and update `frontend/src/app/constants.ts`.

#### Step 3: Import Test Account to MetaMask
1. Copy private key from Hardhat node output
2. Open MetaMask → Import Account
3. Paste private key
4. Switch to **Localhost 8545** network in MetaMask

#### Step 4: Start Frontend
In a **new terminal**:
```bash
cd frontend
npm run dev
```

Access application at: **http://localhost:3000**

#### Step 5: Connect Wallet
1. Click "Connect Wallet" button
2. Approve MetaMask connection
3. Your address should appear in navbar

---

## 🌍 Deployment

### Deploy to Sepolia Testnet

#### 1. Fund Wallet with Sepolia ETH
Get testnet ETH from:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

#### 2. Configure Environment
Ensure `.env` has correct `ALCHEMY_SEPOLIA_URL` and `SEPOLIA_PRIVATE_KEY`.

#### 3. Deploy Contract
```bash
cd smart-contract
npx hardhat ignition deploy ./ignition/modules/SecureIPFS.ts --network sepolia
```

Wait for confirmation (may take 1-2 minutes).

#### 4. Verify Contract (Optional)
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

#### 5. Update Frontend
```typescript
// frontend/src/app/constants.ts
export const CONTRACT_ADDRESS = "0xYourSepoliaContractAddress";
```

#### 6. Deploy Frontend

##### Vercel (Recommended)
```bash
cd frontend
npm install -g vercel
vercel
```

Follow prompts to deploy.

##### Netlify
```bash
npm run build
# Upload .next/out folder to Netlify
```

---

## 📖 Usage Guide

### For Creators: Creating an Asset

1. **Navigate to Creator Dashboard**
   ```
   http://localhost:3000/admin/create
   ```

2. **Fill Asset Details**
   - **Title**: Asset name
   - **Description**: Detailed description
   - **File**: Upload digital content (image/video/document)
   - **Price**: Set in ETH (e.g., 0.01)
   - **Max Supply**: Number of editions (1 = unique, 100 = limited edition)
   - **Royalty**: Percentage for secondary sales (0-100%)

3. **Submit Transaction**
   - Click "Create Asset"
   - Approve MetaMask transaction
   - Wait for confirmation (15-20 seconds)

4. **Asset Published**
   - Asset appears on marketplace homepage
   - You receive the first NFT
   - Buyers can now purchase access

### For Buyers: Purchasing an Asset

1. **Browse Marketplace**
   - Scroll through asset grid
   - View prices and supply

2. **Select Asset**
   - Click "Buy Access" on desired asset
   - Review details in modal

3. **Confirm Purchase**
   - Approve MetaMask transaction
   - Send exact ETH amount
   - Wait for confirmation

4. **Access Content**
   - NFT minted to your wallet
   - "Decrypt Content" button appears
   - Click to download original file

### Withdrawing Earnings

1. **Check Balance**
   - Navigate to profile/dashboard
   - View pending withdrawals

2. **Withdraw Funds**
   ```typescript
   await contract.withdrawFunds();
   ```
   - Approve MetaMask transaction
   - ETH transferred to your wallet

---

## 🔒 Security Features

### Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Generation**: Web Crypto API (cryptographically secure)
- **Key Storage**: On-chain (encrypted, access-controlled)
- **IV**: Random 12-byte nonce per encryption

### Smart Contract Security
- **Reentrancy Protection**: `nonReentrant` modifier on financial functions
- **Access Control**: NFT balance verification before key access
- **Pull Payment Pattern**: Users withdraw own funds
- **Integer Overflow**: Solidity 0.8.x built-in checks
- **OpenZeppelin**: Industry-standard secure contracts

### Frontend Security
- **Input Validation**: Price, supply, and royalty checks
- **Transaction Confirmation**: User approval required
- **Error Handling**: Graceful failure with user feedback
- **State Management**: React hooks for consistent state

### Best Practices
✅ Never commit `.env` files  
✅ Use `.gitignore` for sensitive files  
✅ Validate all user inputs  
✅ Test on testnet before mainnet  
✅ Audit smart contracts before production  
✅ Use hardware wallets for deployment keys  

---

## 🧪 Testing

### Smart Contract Tests

#### Run All Tests
```bash
cd smart-contract
npx hardhat test
```

#### Run Specific Test
```bash
npx hardhat test test/SecureIPFSMarketplace.test.ts
```

#### Test Coverage
```bash
npx hardhat coverage
```

### Frontend Testing

#### Unit Tests (if implemented)
```bash
cd frontend
npm run test
```

#### E2E Tests (if using Playwright/Cypress)
```bash
npm run test:e2e
```

### Manual Testing Checklist

- [ ] Wallet connection (MetaMask)
- [ ] Asset creation with valid inputs
- [ ] Asset creation with invalid inputs (error handling)
- [ ] Purchase flow (successful)
- [ ] Purchase with insufficient funds (error)
- [ ] Duplicate purchase attempt (error)
- [ ] Content decryption after purchase
- [ ] Withdrawal of creator earnings
- [ ] Toggle asset status (active/inactive)
- [ ] Sold-out asset handling
- [ ] Responsive UI on mobile/tablet
- [ ] 3D scene rendering performance

---

## ⚙️ Configuration

### Contract Configuration (`hardhat.config.ts`)
```typescript
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
  },
};
```

### Frontend Configuration (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ipfs.io'],
  },
};
```

### Environment Variables

#### Smart Contract (`.env`)
```env
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_without_0x
```

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 1. Fork the Repository
```bash
git clone https://github.com/YOUR_USERNAME/Secure-IPFS-Marketplace.git
```

### 2. Create Feature Branch
```bash
git checkout -b feature/AmazingFeature
```

### 3. Make Changes
- Write clean, documented code
- Follow existing code style
- Add tests for new features

### 4. Commit Changes
```bash
git commit -m "feat: Add amazing feature"
```
Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

### 5. Push to Branch
```bash
git push origin feature/AmazingFeature
```

### 6. Open Pull Request
- Describe changes in detail
- Reference related issues
- Ensure CI checks pass

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Sambit Kumar Mohanty

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact & Support

- **Developer**: Sambit Kumar Mohanty
- **GitHub**: [@Sambit-Kumar-Mohanty-26](https://github.com/Sambit-Kumar-Mohanty-26)
- **Repository**: [Secure-IPFS-Marketplace](https://github.com/Sambit-Kumar-Mohanty-26/Secure-IPFS-Marketplace)

### Get Help
- 🐛 **Report Bugs**: [Open an Issue](https://github.com/Sambit-Kumar-Mohanty-26/Secure-IPFS-Marketplace/issues)
- 💡 **Feature Requests**: [Open a Discussion](https://github.com/Sambit-Kumar-Mohanty-26/Secure-IPFS-Marketplace/discussions)
- 📧 **Email**: sambitkumarmohanty25@gmail.com

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Secure smart contract libraries
- **Hardhat** - Ethereum development environment
- **Next.js Team** - React framework
- **ethers.js** - Ethereum library
- **Three.js Community** - 3D graphics
- **IPFS Protocol Labs** - Decentralized storage

---

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ ERC1155 marketplace contract
- ✅ AES-256 encryption
- ✅ Basic frontend UI
- ✅ MetaMask integration

### Phase 2 (Future)
- 🔲 Secondary marketplace (NFT resales)
- 🔲 Auction mechanism
- 🔲 Multi-chain support (Polygon, Arbitrum)
- 🔲 Social features (likes, comments, shares)
- 🔲 Creator verification system
- 🔲 Mobile app (React Native)

### Phase 3 (Vision)
- 🔲 DAO governance
- 🔲 Token-gated communities
- 🔲 Decentralized identity (DID)
- 🔲 Cross-marketplace asset portability

---

## 📊 Project Statistics

- **Smart Contract Size**: ~4.2 KB (SecureIPFSMarketplace.sol)
- **Frontend Bundle**: ~33 KB (page.tsx) + dependencies
- **Total Commits**: 11
- **Languages**: TypeScript, Solidity, CSS
- **Test Coverage**: (Add after implementing tests)

---

## 🔍 FAQ

### Q: What file types can I upload?
**A:** Any digital file - images, videos, 3D models, documents, audio files, etc. The encryption works at the binary level.

### Q: How much does it cost to create an asset?
**A:** You pay gas fees for the smart contract transaction (typically $5-20 on Ethereum mainnet, <$1 on Sepolia testnet).

### Q: Can I change the price after creating an asset?
**A:** Not in the current version. You can toggle active/inactive status but not modify the price.

### Q: What happens if I lose my wallet?
**A:** Your NFTs and funds are tied to your wallet address. If you lose access, they cannot be recovered. Always backup your seed phrase!

### Q: Is the content truly private?
**A:** Yes. Files are encrypted with AES-256 before uploading to IPFS. Only NFT holders can retrieve the decryption key from the smart contract.

### Q: Can I sell my NFT to someone else?
**A:** Current version doesn't support transfers. Implementing ERC1155 `safeTransferFrom` will enable secondary sales.

### Q: What are royalties?
**A:** Royalties are percentages of secondary sales that automatically go to the original creator. Supported via ERC2981 standard.

---

**Built with ❤️ by Sambit Kumar Mohanty**

⭐ **Star this repository** if you find it helpful!

🍴 **Fork** to create your own version

🐛 **Report issues** to help improve the project

---

*Last Updated: January 14, 2026*
