import { ethers } from "ethers";

export async function generateKey(): Promise<string> {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await window.crypto.subtle.exportKey("raw", key);
  return ethers.hexlify(new Uint8Array(exported));
}

export async function encryptFile(file: File, keyHex: string) {
  const keyBytes = ethers.getBytes(keyHex);
  
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    "AES-GCM",
    false,
    ["encrypt"]
  );
  const fileBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    fileBuffer
  );
  const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedContent), iv.length);

  return combined; 
}