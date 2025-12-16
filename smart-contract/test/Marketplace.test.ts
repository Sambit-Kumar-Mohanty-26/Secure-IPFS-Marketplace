import { expect } from "chai";
import { ethers } from "hardhat";
import { SecureIPFSMarketplace } from "../typechain-types";

describe("SecureIPFSMarketplace", function () {
  let marketplace: SecureIPFSMarketplace;
  let owner: any, creator: any, buyer: any;

  beforeEach(async function () {
    [owner, creator, buyer] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("SecureIPFSMarketplace");
    marketplace = await Marketplace.deploy();
  });

  it("Feature 1: Should allow a creator to list an asset", async function () {
    // 1. Create Asset
    const price = ethers.parseEther("1.0");
    await marketplace.connect(creator).createAsset(price, "ipfs://meta", "encrypted_key_abc");

    // 2. Check Logic
    const asset = await marketplace.getAssetPublicInfo(1);
    expect(asset[0]).to.equal(1); // ID
    expect(asset[1]).to.equal(price); // Price
    expect(asset[3]).to.equal(creator.address); // Creator
  });

  it("Feature 2: Should allow a user to buy access", async function () {
    const price = ethers.parseEther("0.5");
    await marketplace.connect(creator).createAsset(price, "ipfs://meta", "secret_key");

    // 1. Buy Access
    await marketplace.connect(buyer).buyAccess(1, { value: price });

    // 2. Check Logic (ERC1155 Balance)
    const balance = await marketplace.balanceOf(buyer.address, 1);
    expect(balance).to.equal(1n);
  });

  it("Feature 3: Should prevent unauthorized access to keys", async function () {
    const price = ethers.parseEther("0.5");
    await marketplace.connect(creator).createAsset(price, "ipfs://meta", "SUPER_SECRET_KEY");

    // 1. Try to read key WITHOUT buying
    await expect(
      marketplace.connect(buyer).getEncryptedKey(1)
    ).to.be.revertedWith("Not authorized: Purchase NFT first");

    // 2. Buy and Try again
    await marketplace.connect(buyer).buyAccess(1, { value: price });
    const key = await marketplace.connect(buyer).getEncryptedKey(1);
    expect(key).to.equal("SUPER_SECRET_KEY");
  });

  it("Feature 4: Should allow creator to withdraw funds (Pull Payment)", async function () {
    const price = ethers.parseEther("2.0");
    await marketplace.connect(creator).createAsset(price, "ipfs://meta", "key");
    await marketplace.connect(buyer).buyAccess(1, { value: price });

    // 1. Check Pending Balance
    const pending = await marketplace.pendingWithdrawals(creator.address);
    expect(pending).to.equal(price);

    // 2. Withdraw
    const initialEth = await ethers.provider.getBalance(creator.address);
    // Execute withdraw
    const tx = await marketplace.connect(creator).withdrawFunds();
    const receipt = await tx.wait();
    
    // Calculate gas used to verify balance accurately
    const gasUsed = receipt!.fee; 
    
    const finalEth = await ethers.provider.getBalance(creator.address);
    
    // Final Balance should be Initial + Price - Gas
    expect(finalEth).to.equal(initialEth + price - gasUsed);
  });
});