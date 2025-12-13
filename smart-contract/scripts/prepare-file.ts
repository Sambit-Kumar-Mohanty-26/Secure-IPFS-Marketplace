import fs from 'fs';
import crypto from 'crypto';
import { ethers } from 'ethers';
import * as dotenv from "dotenv";

dotenv.config();

const FILE_PATH = "../design.pdf"; 
const OUTPUT_FILE = "encrypted-assets.txt"; 

const PASSWORD = process.env.SECRET_FILE_PASSWORD;
const ADMIN_PRIVATE_KEY = ethers.Wallet.createRandom().privateKey;

async function main() {
  if (!PASSWORD) {
    console.error("❌ Error: SECRET_FILE_PASSWORD is missing from your .env file!");
    process.exit(1);
  }

  console.log("🔒 Preparing Secure Asset...");
  console.log(`   (Using password from .env: "${PASSWORD.slice(0,3)}***")`);

  if (!fs.existsSync(FILE_PATH)) {
    console.log("⚠️ No design.pdf found, creating a dummy one.");
    fs.writeFileSync(FILE_PATH, "This is the secret content of the PDF.");
  }

  const fileBuffer = fs.readFileSync(FILE_PATH);
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(PASSWORD, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedPayload = Buffer.concat([salt, iv, authTag, encrypted]).toString('hex');
  
  fs.writeFileSync(OUTPUT_FILE, encryptedPayload);

  const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY);
  const fileHash = ethers.keccak256(fileBuffer);
  const signature = await wallet.signMessage(ethers.getBytes(fileHash));

  console.log("\n✅ SUCCESS! -----------------------------------");
  console.log(`1. I have created a file named '${OUTPUT_FILE}' in your smart-contract folder.`);
  console.log("2. UPLOAD that specific file to Pinata (https://pinata.cloud).");
  console.log("3. COPY the CID from Pinata.");
  console.log("4. UPDATE your SecureIPFS.ts file with the CID and the Signature below:");
  console.log("------------------------------------------------");
  console.log(`Signature: "${signature}"`);
  console.log("------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });