"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Lock, Unlock, Fingerprint, Loader2, FileText, ShoppingBag, X, CheckCircle, AlertOctagon, Terminal, Filter, LayoutGrid, Plus, Trash2, ShieldCheck, Search, SearchX, Play, Music, Image as ImageIcon, File, ArrowDownToLine, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
import { CONTRACT_ADDRESS, ABI } from "../constants";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const Scene3D = dynamic(() => import("../components/Scene"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black"></div>
});

interface AssetMetadata {
    name: string;
    description: string;
    image?: string;
    encrypted_content: string | string[]; 
}

interface DigitalAsset {
    id: number;
    price: bigint;
    metadataCid: string;
    creator: string;
    meta: AssetMetadata | null; 
    isOwned: boolean;
    active: boolean;
    maxSupply: number;
    currentSupply: number;
    royalty: number;
}

interface NotificationState {
    type: "success" | "error" | "info";
    title: string;
    message: string;
    txHash?: string;
}

async function fetchIPFS(cid: string, returnType: "json" | "hex" = "json"): Promise<any> {
    const cleanCid = cid.replace("ipfs://", "");
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cleanCid}`,
        `https://ipfs.io/ipfs/${cleanCid}`,
        `https://dweb.link/ipfs/${cleanCid}`
    ];

    for (const url of gateways) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                if (returnType === "hex") {
                    const buffer = await response.arrayBuffer();
                    return ethers.hexlify(new Uint8Array(buffer));
                }
                const text = await response.text();
                try {
                    return JSON.parse(text);
                } catch {
                    return text; 
                }
            }
        } catch (e) {
            console.warn(`Gateway ${url} failed...`);
        }
    }
    throw new Error("Failed to load IPFS content");
}

async function decryptFile(fileHex: string, keyHex: string): Promise<Uint8Array | null> {
    if (typeof window === "undefined") return null;

    try {
        const fileBytes = ethers.getBytes(fileHex);
        const iv = fileBytes.slice(0, 12);
        const ciphertext = fileBytes.slice(12);

        const keyBytes = ethers.getBytes(keyHex);
        const cryptoKey = await window.crypto.subtle.importKey(
            "raw",
            keyBytes as unknown as BufferSource,
            "AES-GCM",
            false,
            ["decrypt"]
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            cryptoKey,
            ciphertext
        );

        return new Uint8Array(decryptedBuffer);
    } catch (error: any) {
        console.error("Decryption internals failed:", error);
        throw new Error("Decryption Failed: The key does not match this file.");
    }
}

export default function Home() {
    const [account, setAccount] = useState("");
    const [assets, setAssets] = useState<DigitalAsset[]>([]);
    const [status, setStatus] = useState("SYSTEM_INIT");
    const [loadingId, setLoadingId] = useState<number | null>(null);
    const [decryptedContent, setDecryptedContent] = useState<{id: number, files: Uint8Array[]} | null>(null);   
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [filterMode, setFilterMode] = useState<"ALL" | "OWNED">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    async function connectWallet() {
        if (!window.ethereum) return alert("MetaMask Required");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
    }

    async function loadMarketplace() {
        try {
            if (!window.ethereum) { setStatus("OFFLINE_MODE"); return; }
            setStatus("SCANNING_NET");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
            
            try { await contract.assetCount(); } catch { setStatus("NET_ERROR"); return; }

            const count = await contract.assetCount();
            const countNum = Number(count);

            const promises = [];

            for(let i = countNum; i > 0 && i > countNum - 20; i--) {

                promises.push((async () => {
                    try {
                        const data = await contract.assets(i);

                        const isActive = data[5];
                        let isOwned = false;
                        
                        if(account) {
                            try {
                                const balance = await contract.balanceOf(account, i);
                                isOwned = balance > 0n;
                            } catch(e) {
                                console.warn(`Balance check failed for ID ${i}`);
                            }
                        }

                        if (!isActive && !isOwned) return null; 
                        
                        let meta = null;
                        try {
                            meta = await fetchIPFS(data[2], "json");
                        } catch(e) {
                            console.error("Failed to load metadata", i);
                        }

                        return {
                            id: Number(data[0]),
                            price: data[1],
                            metadataCid: data[2],
                            creator: data[4],
                            meta,
                            isOwned,
                            active: isActive,
                            maxSupply: Number(data[6]),
                            currentSupply: Number(data[7]),
                            royalty: Number(data[8]) / 100
                        } as DigitalAsset;

                    } catch (innerErr) {
                        console.error(`Error fetching asset ${i}`, innerErr);
                        return null;
                    }
                })());
            }

            const results = await Promise.all(promises);

            const validAssets = results.filter((item): item is DigitalAsset => item !== null);

            setAssets(validAssets);
            setStatus("CONNECTED");
        } catch (err) {
            console.error(err);
            setStatus("OFFLINE_MODE");
        }
    }

    async function toggleAssetStatus(asset: DigitalAsset) {
        try {
            setLoadingId(asset.id);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const tx = await contract.toggleAssetStatus(asset.id);
            const isHiding = asset.active;

            setNotification({ 
                type: "info", 
                title: isHiding ? "HIDING ASSET" : "RESTORING ASSET", 
                message: isHiding 
                    ? "Removing asset from public marketplace..." 
                    : "Making asset visible on marketplace again...", 
                txHash: tx.hash 
            });

            await tx.wait();
            
            setNotification({ 
                type: "success", 
                title: isHiding ? "ASSET HIDDEN" : "ASSET RESTORED", 
                message: isHiding 
                    ? "Item successfully hidden. It is no longer purchasable." 
                    : "Item successfully restored. It is now purchasable.", 
                txHash: tx.hash 
            });

            loadMarketplace();
        } catch(err: any) {
            setNotification({ type: "error", title: "ERROR", message: err.message });
        } finally {
            setLoadingId(null);
        }
    }

    async function buyAccess(asset: DigitalAsset) {
        try {
            setLoadingId(asset.id);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const tx = await contract.buyAccess(asset.id, { value: asset.price });
            
            setNotification({ type: "info", title: "TX SUBMITTED", message: "Waiting for blockchain confirmation...", txHash: tx.hash });
            await tx.wait();
            
            setNotification({ type: "success", title: "ACCESS GRANTED", message: `Asset #${asset.id} unlocked.`, txHash: tx.hash });
            loadMarketplace();
        } catch (err: any) {
            setNotification({ type: "error", title: "TRANSACTION FAILED", message: err.message || "User rejected transaction" });
        } finally {
            setLoadingId(null);
        }
    }

    async function handleDecrypt(asset: DigitalAsset) {
        if(!asset.meta) return;
        try {
            setLoadingId(asset.id);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const rawKeyHex = await contract.getEncryptedKey(asset.id);
            
            const cids = Array.isArray(asset.meta.encrypted_content) 
                ? asset.meta.encrypted_content 
                : [asset.meta.encrypted_content];

            const decryptedFiles: Uint8Array[] = [];

            for (const cid of cids) {
                const fileHex = await fetchIPFS(cid, "hex");
                const result = await decryptFile(fileHex, rawKeyHex);
                if (result) decryptedFiles.push(result);
            }
            
            if (decryptedFiles.length > 0) {
                setDecryptedContent({ id: asset.id, files: decryptedFiles });
                setNotification({ type: "success", title: "DECRYPTION COMPLETE", message: `${decryptedFiles.length} file(s) unlocked.` });
            }
        } catch (err: any) {
            console.error(err);
            setNotification({ type: "error", title: "DECRYPTION FAILED", message: err.message });
        } finally {
            setLoadingId(null);
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            loadMarketplace();
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if(accounts.length > 0) setAccount(accounts[0]);
                else setAccount("");
            });
        }
    }, [account]);

    const renderSingleFile = (content: Uint8Array, index: number) => {
        const blob = new Blob([content as any]);
        const url = URL.createObjectURL(blob);
        
        if (content[0] === 37 && content[1] === 80) {
            const pdfBlob = new Blob([content as any], { type: "application/pdf" });
            return (
                <div key={index} className="w-full h-96 border border-white/10 rounded-lg overflow-hidden bg-white mb-6">
                    <iframe src={URL.createObjectURL(pdfBlob)} className="w-full h-full border-none" />
                </div>
            );
        }
        
        if ((content[0] === 137 && content[1] === 80) || (content[0] === 255 && content[1] === 216) || (content[0] === 71 && content[1] === 73)) {
             return (
                <div key={index} className="mb-6 text-center">
                    <img src={url} className="max-w-full max-h-96 object-contain mx-auto rounded-lg border border-white/10 shadow-lg" />
                    <a href={url} download={`image_${index}.png`} className="text-xs text-emerald-500 hover:underline mt-2 inline-flex items-center gap-1"><ArrowDownToLine className="w-3 h-3"/> Download Image</a>
                </div>
             );
        }

        if (content[4] === 102 && content[5] === 116 && content[6] === 121 && content[7] === 112) {
             const vidBlob = new Blob([content as any], { type: "video/mp4" });
             return (
                <div key={index} className="mb-6">
                    <video controls src={URL.createObjectURL(vidBlob)} className="w-full rounded-lg border border-white/10 shadow-lg" />
                </div>
             );
        }

        if ((content[0] === 73 && content[1] === 68 && content[2] === 51) || (content[0] === 255 && content[1] === 251)) {
             const audioBlob = new Blob([content as any], { type: "audio/mpeg" });
             return (
                <div key={index} className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 flex items-center gap-4">
                    <div className="p-3 bg-rose-500/20 rounded-full"><Music className="w-6 h-6 text-rose-500" /></div>
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                </div>
             );
        }

        return (
            <div key={index} className="mb-6 p-4 bg-black/50 rounded-lg border border-emerald-500/20 overflow-auto h-48 shadow-inner">
                <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">
                    {new TextDecoder().decode(content)}
                </pre>
            </div>
        );
    };

    const displayedAssets = assets.filter(asset => {
        const matchesFilter = filterMode === "OWNED" ? asset.isOwned : true;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            asset.meta?.name.toLowerCase().includes(searchLower) || 
            asset.meta?.description.toLowerCase().includes(searchLower) ||
            asset.id.toString() === searchLower;

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen w-full bg-black text-white font-mono relative selection:bg-rose-500/30">
            
            <div className="fixed inset-0 z-0 w-full h-full pointer-events-none opacity-50">
                {!isMobile ? (
                    <Scene3D unlocked={false} />
                ) : (
                    // This is the fallback for Mobile (Static Gradient Sphere)
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <div className="w-64 h-64 rounded-full bg-linear-to-br from-gray-900 to-black border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center">
                            <span className="text-white/20 text-xs tracking-widest">MOBILE_OPTIMIZED</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

            <AnimatePresence>
                {notification && (
                    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="fixed top-24 right-6 z-200 w-full max-w-sm">
                        <div className={`relative overflow-hidden rounded-lg border backdrop-blur-xl p-4 shadow-2xl ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50' : notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/50' : 'bg-blue-950/90 border-blue-500/50'}`}>
                            <div className="flex gap-4">
                                <div className={`mt-1 p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500 text-black' : notification.type === 'error' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                                    {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
                                    {notification.type === 'error' && <AlertOctagon className="w-5 h-5" />}
                                    {notification.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold tracking-widest">{notification.title}</h4>
                                    <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                                </div>
                                <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white h-fit"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col min-h-screen">
                
                <header className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-black/60 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Fingerprint className="text-rose-500 w-6 h-6" />
                        <div>
                            <h1 className="text-lg font-bold tracking-widest">OBSIDIAN_MARKET</h1>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${status === "CONNECTED" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></div>
                                <span className="text-[10px] text-gray-400">{status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/admin/create">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-xs font-bold rounded hover:bg-white/10 transition">
                                <Plus className="w-3 h-3" /> CREATE_ASSET
                            </button>
                        </Link>

                        {!account ? (
                            <button onClick={connectWallet} className="px-5 py-2 bg-white hover:bg-gray-200 text-black font-bold text-xs tracking-widest rounded-sm transition">
                                CONNECT_WALLET
                            </button>
                        ) : (
                            <div className="px-4 py-2 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full backdrop-blur-md">
                                {account.slice(0,6)}...{account.slice(-4)}
                            </div>
                        )}
                    </div>
                </header>

                <main className="grow p-6 md:p-12">
                    
                    {decryptedContent && (
                         <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md p-8 animate-in fade-in duration-300">
                             <div className="w-full max-w-4xl h-[85vh] bg-black border border-emerald-500/50 rounded-xl overflow-hidden relative flex flex-col shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                                <div className="p-4 border-b border-emerald-500/30 flex justify-between items-center bg-emerald-950/30">
                                    <h3 className="text-emerald-400 font-bold flex items-center gap-2 tracking-widest text-sm">
                                        <Terminal className="w-4 h-4"/> DECRYPTED_PAYLOAD_VIEWER
                                    </h3>
                                    <button onClick={() => setDecryptedContent(null)} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">
                                        CLOSE_CONNECTION [X]
                                    </button>
                                </div>
                                <div className="grow bg-white/5 p-6 overflow-y-auto relative">
                                    {decryptedContent.files.map((fileBytes, idx) => renderSingleFile(fileBytes, idx))}
                                </div>
                             </div>
                         </div>
                    )}
                    <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-gray-500" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search by Asset Name or ID..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all placeholder:text-gray-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-1 flex gap-1">
                            <button 
                                onClick={() => setFilterMode("ALL")}
                                className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${
                                    filterMode === "ALL" 
                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-900/50" 
                                    : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <LayoutGrid className="w-3 h-3" /> MARKET
                            </button>
                            <button 
                                onClick={() => setFilterMode("OWNED")}
                                className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${
                                    filterMode === "OWNED" 
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-900/50" 
                                    : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <Filter className="w-3 h-3" /> LIBRARY
                            </button>
                        </div>
                    </div>

                    {(status === "SCANNING_NET" || status === "SYSTEM_INIT") ? (
                        <div className="text-center py-32 text-gray-500 space-y-4">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                                <Loader2 className="w-12 h-12 animate-spin relative z-10 text-rose-500"/>
                            </div>
                            <p className="tracking-[0.2em] text-sm animate-pulse">SCANNING BLOCKCHAIN FOR ASSETS...</p>
                        </div>
                     ) : status === "OFFLINE_MODE" ? (
                        <div className="text-center py-20 space-y-4 animate-in fade-in zoom-in-95">
                            <div className="p-4 bg-red-500/10 rounded-full inline-block mb-2 border border-red-500/20">
                                <AlertOctagon className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-widest">CONNECTION LOST</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                                We cannot read the blockchain data. This usually happens if:
                                <br/>1. MetaMask is locked.
                                <br/>2. You are on the wrong network (Switch to Sepolia or Localhost).
                            </p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-6 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition"
                            >
                                RETRY CONNECTION
                            </button>
                        </div>
                    ) : displayedAssets.length === 0 ? (
                        <div className="text-center py-32 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="p-4 bg-white/5 rounded-full inline-block mb-2">
                                <SearchX className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 tracking-widest">
                                {searchQuery ? "NO SEARCH RESULTS" : (filterMode === "ALL" ? "NO MARKET ASSETS FOUND" : "LIBRARY EMPTY")}
                            </h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : (filterMode === "ALL" ? "The marketplace is currently waiting for new deployments. Be the first to mint." : "You haven't purchased any secure assets yet.")}
                            </p>
                            {filterMode === "ALL" && (
                                <Link href="/admin/create">
                                    <button className="mt-4 px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded hover:bg-emerald-500/20 transition">
                                        INITIALIZE MINTING
                                    </button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {displayedAssets.map((asset) => (
                                <div key={asset.id} className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-rose-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(225,29,72,0.3)]">
                                    
                                    <div className="h-56 bg-linear-to-br from-gray-900 to-black border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <FileText className="w-16 h-16 text-gray-700 group-hover:text-rose-500 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" />

                                        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 max-w-[70%]">
                                            <div className="text-[10px] bg-emerald-950/90 backdrop-blur-md border border-emerald-500/30 px-2 py-1 rounded flex items-center gap-2 shadow-lg whitespace-nowrap">
                                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                <span className="text-emerald-400 font-mono tracking-wide">
                                                    {asset.creator.slice(0,4)}...{asset.creator.slice(-4)}
                                                </span>
                                            </div>
                                            
                                            {asset.royalty > 0 && (
                                                <div className="text-[10px] bg-purple-950/90 backdrop-blur-md border border-purple-500/30 px-2 py-1 rounded flex items-center gap-1 shadow-lg whitespace-nowrap">
                                                    <span className="text-purple-400 font-bold tracking-widest">
                                                        {asset.royalty}% ROYALTY
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute top-4 right-4 text-[10px] bg-white/5 backdrop-blur px-2 py-1 rounded border border-white/10 text-gray-400">
                                            ASSET_ID :: {asset.id.toString().padStart(3, '0')}
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold truncate text-white group-hover:text-rose-400 transition-colors tracking-wide">
                                                {asset.meta?.name || `Unknown Asset #${asset.id}`}
                                            </h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed">
                                                {asset.meta?.description || "No metadata available for this secure asset."}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                            <div className="w-full mr-4">
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase tracking-widest">
                                                    <span>Price</span>
                                                    <span className={asset.currentSupply >= asset.maxSupply ? "text-red-500" : "text-emerald-500"}>
                                                        Edition {asset.currentSupply}/{asset.maxSupply}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-light text-white">{ethers.formatEther(asset.price)} <span className="text-sm text-gray-600">ETH</span></p>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {account && account.toLowerCase() === asset.creator.toLowerCase() && (
                                                    <button 
                                                        onClick={() => toggleAssetStatus(asset)} 
                                                        disabled={loadingId === asset.id}
                                                        className={`p-2.5 border rounded transition-all disabled:opacity-50 ${
                                                            asset.active 
                                                            ? "bg-red-950/30 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white" 
                                                            : "bg-emerald-950/30 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                        }`}
                                                        title={asset.active ? "Deactivate Asset" : "Reactivate Asset"}
                                                    >
                                                        {loadingId === asset.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin"/>
                                                        ) : asset.active ? (
                                                            <Trash2 className="w-4 h-4" />
                                                        ) : (
                                                            <RefreshCw className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {asset.isOwned ? (
                                                    <button 
                                                        onClick={() => handleDecrypt(asset)}
                                                        disabled={loadingId === asset.id}
                                                        className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-xs font-bold rounded flex items-center gap-2 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                                                    >
                                                        {loadingId === asset.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Unlock className="w-3 h-3"/>}
                                                        DECRYPT
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => buyAccess(asset)}
                                                        disabled={loadingId === asset.id || asset.currentSupply >= asset.maxSupply}
                                                        className={`px-5 py-2.5 text-xs font-bold rounded flex items-center gap-2 transition-all shadow-lg
                                                            ${asset.currentSupply >= asset.maxSupply 
                                                                ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/10" 
                                                                : "bg-white text-black hover:bg-gray-200 hover:scale-105"
                                                            }`}
                                                    >
                                                        {loadingId === asset.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ShoppingBag className="w-3 h-3"/>}
                                                        {asset.currentSupply >= asset.maxSupply ? "SOLD OUT" : "PURCHASE"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}