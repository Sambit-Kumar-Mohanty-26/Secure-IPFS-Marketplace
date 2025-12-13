"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import { Lock, Unlock, Fingerprint, Shield, Cpu, Loader2 } from "lucide-react";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = [
  "function getPublicData() view returns (string, string, uint256)",
  "function isAuthorized(address user) view returns (bool)",
  "function requestAccess() payable",
  "function getEncryptedKey() view returns (string)"
];

const Scene3D = dynamic(() => import("./components/Scene"), { ssr: false });

declare global {
  interface Window {
    ethereum?: any;
  }
}

async function decryptFile(encryptedHex: string, password: string): Promise<Uint8Array | null> {
  if (typeof window === "undefined") return null;

  const data = ethers.getBytes("0x" + encryptedHex);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const authTag = data.slice(28, 44);
  const encryptedContent = data.slice(44);
  const passwordBytes = ethers.toUtf8Bytes(password);
  const key = await ethers.scrypt(passwordBytes, salt, 16384, 8, 1, 32);
  const keyArray = ethers.getBytes(key);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyArray as unknown as BufferSource,
    "AES-GCM",
    false,
    ["decrypt"]
  );

  const encryptedWithTag = new Uint8Array(encryptedContent.length + authTag.length);
  encryptedWithTag.set(encryptedContent);
  encryptedWithTag.set(authTag, encryptedContent.length);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    encryptedWithTag as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

const renderDecryptedContent = (data: Uint8Array | null) => {
  if (!data) return null;

  try {
    const isPDF = data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70;

    if (isPDF) {
      const blob = new Blob([data as any], { type: "application/pdf" });
      const fileUrl = URL.createObjectURL(blob);

      return (
        <iframe
          src={fileUrl}
          className="w-full h-150 rounded-lg border-none bg-white"
          title="Secure Document"
        />
      );
    } 
    
    const textDecoder = new TextDecoder();
    const textContent = textDecoder.decode(data);
    return (
      <div className="h-64 bg-black/50 rounded border border-emerald-500/20 p-4 overflow-y-auto">
        <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap break-all">
          {textContent}
        </pre>
      </div>
    );

  } catch (e) {
    console.error("Render Error:", e);
    return <div className="text-red-500">Error displaying file.</div>;
  }
};

export default function Home() {
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("SYSTEM_INIT");
  const [fileData, setFileData] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask Required");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    setAccount(await signer.getAddress());
  }

  async function loadData() {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      const [cid, sig, price] = await contract.getPublicData();
      setFileData({ cid, sig, price });

      if (account) {
        const authorized = await contract.isAuthorized(account);
        setIsAuthorized(authorized);
      }
      setStatus("CONNECTED");
    } catch (err) {
      console.error(err);
      setStatus("OFFLINE_MODE");
    }
  }

  async function buyAccess() {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.requestAccess({ value: fileData.price });
      await tx.wait();
      setIsAuthorized(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecrypt() {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const secretPassword = await contract.getEncryptedKey();
      const cid = fileData.cid.replace("ipfs://", "");      
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (!response.ok) throw new Error("Failed to fetch from IPFS");
      
      const encryptedHex = await response.text();
      const result = await decryptFile(encryptedHex.trim(), secretPassword);
      setDecryptedContent(result);
    } catch (err: any) {
      console.error(err);
      alert("Decryption Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [account]);

  return (
    <div className="h-screen w-full bg-black text-white font-mono overflow-hidden relative selection:bg-rose-500/30">
      
      <Scene3D unlocked={isAuthorized} />

      <div className="absolute inset-0 z-10 p-6 md:p-12 pointer-events-none flex flex-col justify-between">
        
        <header className="flex justify-between items-start pointer-events-auto">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/5 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center">
                <Fingerprint className="text-rose-500 w-6 h-6" />
             </div>
             <div>
                <h1 className="text-xl font-bold tracking-widest">OBSIDIAN_VAULT</h1>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === "OFFLINE_MODE" ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`}></div>
                    <span className="text-xs text-gray-400">{status}</span>
                </div>
             </div>
          </div>

          {!account ? (
             <button onClick={connectWallet} className="px-6 py-2 bg-white text-black font-bold text-xs tracking-widest hover:bg-gray-200 transition">
                CONNECT_WALLET
             </button>
          ) : (
             <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                {account.slice(0,6)}...{account.slice(-4)}
             </div>
          )}
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end pointer-events-auto">
            
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 group-hover:h-1/2 transition-all duration-500"></div>
                
                {fileData ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Encrypted Payload</h3>
                                <p className="text-sm text-white font-sans truncate w-48 md:w-64">{fileData.cid}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Price</h3>
                                <p className="text-2xl font-light text-white">{ethers.formatEther(fileData.price)} ETH</p>
                            </div>
                        </div>

                        {!isAuthorized ? (
                            <button 
                                onClick={buyAccess} 
                                disabled={loading}
                                className="w-full py-3 bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/20"
                            >
                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {loading ? "PROCESSING..." : "PURCHASE_KEY"}
                            </button>
                        ) : (
                            <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg flex items-center justify-center gap-2">
                                <Shield className="w-4 h-4" /> ACCESS_GRANTED
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-pulse flex items-center gap-2 text-gray-500">
                        <Cpu className="w-4 h-4" /> CALCULATING...
                    </div>
                )}
            </div>

            {isAuthorized && (
                <div className="bg-emerald-950/40 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-2xl animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <div className="flex items-center gap-2 mb-4 text-emerald-400">
                        <Shield className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-widest">SECURE_CHANNEL</span>
                    </div>

                    {!decryptedContent ? (
                        <button 
                            onClick={handleDecrypt}
                            disabled={loading}
                            className="w-full py-4 border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4" /> DECRYPTING...
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4" /> INITIATE_DECRYPTION
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="w-full">
                            {renderDecryptedContent(decryptedContent)}
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>
    </div>
  );
}