import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";

dotenv.config();
const ENCRYPTED_CID = "ipfs://bafybeihfd56dwa24i6dteqoakbi7yl3sdvmbcsxfi5jt6vlcrzqyrtuhgm";
const DIGITAL_SIGNATURE = "0xea06125cc4e081c791caa64fe31221eae93314a583ed9325d1887db5b41cf69d507ce0dbca641d08ac01e728087324c6e6762fcd16df4345cf4953c41a58ae711c";
const PRICE = 10000000000000000n; 

export default buildModule("SecureIPFSModule", (m) => {
  const encryptedKey = process.env.SECRET_FILE_PASSWORD;

  if (!encryptedKey) {
    throw new Error("❌ Error: SECRET_FILE_PASSWORD is missing from your .env file!");
  }

  const secureIPFS = m.contract("SecureIPFSReference", [
    ENCRYPTED_CID,      
    encryptedKey,       
    DIGITAL_SIGNATURE,  
    PRICE,             
  ]);

  return { secureIPFS };
});