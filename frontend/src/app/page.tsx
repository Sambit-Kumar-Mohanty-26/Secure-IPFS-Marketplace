"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import { Lock, Unlock, Fingerprint, Shield, Cpu, Loader2, AlertTriangle, FileText, Maximize2 } from "lucide-react";
import { CONTRACT_ADDRESS, ABI } from "./constants";

const Scene3D = dynamic(() => import("./components/Scene"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black"></div>
});

interface FileData {
    cid: string;
    sig: string;
    price: bigint;
}

declare global {
    interface Window {
        ethereum?: any;
    }
}

async function fetchFromIPFS(cid: string): Promise<string> {
    const cleanCid = cid.replace("ipfs://", "");
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cleanCid}`,
        `https://ipfs.io/ipfs/${cleanCid}`,
        `https://dweb.link/ipfs/${cleanCid}`
    ];

    for (const url of gateways) {
        try {
            const response = await fetch(url);
            if (response.ok) return await response.text();
        } catch (e) {
            console.warn(`Gateway ${url} failed, trying next...`);
        }
    }
    throw new Error("All IPFS gateways failed to resolve the CID.");
}

async function decryptFile(encryptedHex: string, password: string): Promise<Uint8Array | null> {
    if (typeof window === "undefined") return null;

    try {
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
    } catch (error) {
        console.error("Decryption internals failed:", error);
        throw new Error("Invalid Password or Corrupted File");
    }
}

const renderDecryptedContent = (data: Uint8Array | null) => {
    if (!data) return null;

    try {
        const isPDF = data[0] === 37 && data[1] === 80 && data[2] === 68 && data[3] === 70;

        if (isPDF) {
            const blob = new Blob([data as any], { type: "application/pdf" });
            const fileUrl = URL.createObjectURL(blob);
            return (
                <div className="relative w-full h-full group">
                    <iframe
                        src={fileUrl}
                        className="w-full h-[65vh] min-h-100 rounded-lg border-none bg-white shadow-2xl"
                        title="Secure Document"
                    />
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Open in new tab"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </a>
                </div>
            );
        } 
        
        const textDecoder = new TextDecoder();
        const textContent = textDecoder.decode(data);
        return (
            <div className="h-96 bg-black/80 backdrop-blur rounded border border-emerald-500/20 p-6 overflow-y-auto shadow-inner relative">
                <div className="absolute top-0 right-0 p-2 opacity-50">
                    <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <pre className="text-xs md:text-sm text-emerald-300 font-mono whitespace-pre-wrap break-all selection:bg-emerald-500/30">
                    {textContent}
                </pre>
            </div>
        );

    } catch (e) {
        return <div className="text-red-500 flex items-center gap-2"><AlertTriangle/> Error rendering content</div>;
    }
};

export default function Home() {
    const [account, setAccount] = useState("");
    const [status, setStatus] = useState("SYSTEM_INIT");
    const [fileData, setFileData] = useState<FileData | null>(null);
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
            
            const data = await contract.getPublicData();
            if(data) {
                const [cid, sig, price] = data;
                setFileData({ cid, sig, price });
            }

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
        if(!fileData) return;
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const tx = await contract.requestAccess({ value: fileData.price });
            setStatus("TX_PENDING");
            await tx.wait();
            
            setIsAuthorized(true);
            setStatus("ACCESS_GRANTED");
        } catch (err: any) {
            alert(err.message || "Transaction Failed");
            setStatus("TX_FAILED");
        } finally {
            setLoading(false);
        }
    }

    async function handleDecrypt() {
        if(!fileData) return;
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const secretPassword = await contract.getEncryptedKey();
            const encryptedHex = await fetchFromIPFS(fileData.cid);
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
        if(window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if(accounts.length > 0) setAccount(accounts[0]);
                else setAccount("");
            });
        }
    }, [account]);

    return (
        <div className="min-h-screen w-full bg-black text-white font-mono relative selection:bg-rose-500/30">
            <div className="fixed inset-0 z-0 w-full h-full pointer-events-none">
                <Scene3D unlocked={isAuthorized} />
            </div>
            <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col min-h-screen">
                <header className="sticky top-0 z-50 px-6 py-4 md:px-12 md:py-6 flex justify-between items-start backdrop-blur-md bg-black/20 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <Fingerprint className="text-rose-500 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
                                OBSIDIAN<span className="text-rose-500">_</span>VAULT
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${status === "OFFLINE_MODE" || status === "TX_FAILED" ? "bg-red-500" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"}`}></div>
                                <span className="text-[10px] md:text-xs text-gray-400 font-medium tracking-wider">{status}</span>
                            </div>
                        </div>
                    </div>

                    {!account ? (
                        <button onClick={connectWallet} className="px-5 py-2 md:px-6 md:py-2 bg-white hover:bg-gray-100 text-black font-bold text-[10px] md:text-xs tracking-widest transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer rounded-sm">
                            CONNECT_WALLET
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-bold rounded-full backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            {account.slice(0,6)}...{account.slice(-4)}
                        </div>
                    )}
                </header>
                <main className="grow p-6 md:p-12 flex flex-col justify-end gap-8 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end max-w-7xl mx-auto w-full">
                        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl relative group overflow-hidden shadow-2xl transition-transform hover:border-white/20">
                            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-rose-500 to-transparent group-hover:h-3/4 transition-all duration-500"></div>
                            
                            {fileData ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                        <div>
                                            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Cpu className="w-3 h-3" /> Encrypted Payload
                                            </h3>
                                            <p className="text-sm text-gray-300 font-sans truncate w-40 md:w-64 bg-white/5 px-2 py-1 rounded">
                                                {fileData.cid}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Access Price</h3>
                                            <p className="text-2xl md:text-3xl font-light text-white tracking-tighter">
                                                {ethers.formatEther(fileData.price)} <span className="text-sm text-gray-500">ETH</span>
                                            </p>
                                        </div>
                                    </div>

                                    {!isAuthorized ? (
                                        <button 
                                            onClick={buyAccess} 
                                            disabled={loading}
                                            className="w-full py-4 bg-linear-to-r from-rose-700 via-rose-600 to-rose-700 bg-size-[200%_auto] animate-gradient text-white font-bold rounded-lg flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(225,29,72,0.3)] hover:shadow-[0_4px_30px_rgba(225,29,72,0.5)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-[1.02]"
                                        >
                                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            {loading ? "VERIFYING BLOCKCHAIN..." : "PURCHASE_ACCESS_KEY"}
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg flex items-center justify-center gap-2 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                                            <Shield className="w-5 h-5" /> ACCESS GRANTED
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-pulse flex items-center justify-center gap-3 text-gray-500 py-8">
                                    <Loader2 className="w-5 h-5 animate-spin" /> 
                                    <span className="tracking-widest text-xs">ESTABLISHING UPLINK...</span>
                                </div>
                            )}
                        </div>
                        {isAuthorized && (
                            <div className="bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/30 p-6 md:p-8 rounded-2xl animate-in slide-in-from-bottom-10 fade-in duration-700 shadow-[0_0_50px_-10px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

                                <div className="flex items-center justify-between mb-6 text-emerald-400 border-b border-emerald-500/20 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-500/20 rounded">
                                            <Unlock className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold tracking-[0.2em] shadow-emerald-500/50 drop-shadow-sm">SECURE_CHANNEL</span>
                                    </div>
                                    {decryptedContent && <span className="text-[10px] px-2 py-0.5 border border-emerald-500/30 rounded text-emerald-500/70">AES-256-GCM</span>}
                                </div>

                                {!decryptedContent ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400 text-sm mb-6 font-sans">
                                            Encrypted payload received. Private key is ready for decryption.
                                        </p>
                                        <button 
                                            onClick={handleDecrypt}
                                            disabled={loading}
                                            className="w-full py-4 border border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-400 text-emerald-400 font-bold rounded-lg flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
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
                                    </div>
                                ) : (
                                    <div className="w-full animate-in zoom-in-95 duration-500">
                                        {renderDecryptedContent(decryptedContent)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}