"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Lock, Unlock, Fingerprint, Loader2, FileText, ShoppingBag, X, CheckCircle, AlertOctagon, Terminal, Filter, LayoutGrid, Plus, Trash2, ShieldCheck, Search, SearchX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
import { CONTRACT_ADDRESS, ABI } from "./constants";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const Scene3D = dynamic(() => import("./components/Scene"), { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-black"></div>
});

interface AssetMetadata {
    name: string;
    description: string;
    image?: string;
    encrypted_content: string; 
}

interface DigitalAsset {
    id: number;
    price: bigint;
    metadataCid: string;
    creator: string;
    meta: AssetMetadata | null; 
    isOwned: boolean;
    active: boolean; 
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
    const [decryptedContent, setDecryptedContent] = useState<{id: number, content: Uint8Array} | null>(null);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [filterMode, setFilterMode] = useState<"ALL" | "OWNED">("ALL");
    const [searchQuery, setSearchQuery] = useState("");

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
            if (!window.ethereum) return;
            setStatus("SCANNING_NET");
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
            
            try { await contract.assetCount(); } catch { setStatus("NET_ERROR"); return; }

            const count = await contract.assetCount();
            const loadedAssets: DigitalAsset[] = [];
            const countNum = Number(count);

            for(let i = countNum; i > 0 && i > countNum - 20; i--) {
                const data = await contract.getAssetPublicInfo(i);
                
                let meta = null;
                try {
                    meta = await fetchIPFS(data[2], "json");
                } catch(e) {
                    console.error("Failed to load metadata", i);
                }

                let isOwned = false;
                if(account) {
                    const balance = await contract.balanceOf(account, i);
                    isOwned = balance > 0n;
                }

                loadedAssets.push({
                    id: Number(data[0]),
                    price: data[1],
                    metadataCid: data[2],
                    creator: data[3],
                    meta,
                    isOwned,
                    active: true
                });
            }
            setAssets(loadedAssets);
            setStatus("CONNECTED");
        } catch (err) {
            console.error(err);
            setStatus("OFFLINE_MODE");
        }
    }

    async function toggleAssetStatus(assetId: number) {
        try {
            setLoadingId(assetId);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
            
            const tx = await contract.toggleAssetStatus(assetId);
            
            setNotification({ type: "info", title: "UPDATING STATUS", message: "Hiding asset from marketplace...", txHash: tx.hash });
            await tx.wait();
            
            setNotification({ type: "success", title: "ASSET HIDDEN", message: "Asset visibility updated.", txHash: tx.hash });
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
            const fileHex = await fetchIPFS(asset.meta.encrypted_content, "hex");
            const result = await decryptFile(fileHex, rawKeyHex);
            
            if (result) {
                setDecryptedContent({ id: asset.id, content: result });
                setNotification({ type: "success", title: "DECRYPTION COMPLETE", message: "Secure payload rendered in viewer." });
            }
        } catch (err: any) {
            console.error(err);
            setNotification({ type: "error", title: "DECRYPTION FAILED", message: err.message });
        } finally {
            setLoadingId(null);
        }
    }

    useEffect(() => {
        loadMarketplace();
        if(window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if(accounts.length > 0) setAccount(accounts[0]);
                else setAccount("");
            });
        }
    }, [account]);

    const renderContent = (content: Uint8Array) => {
        const blob = new Blob([content as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        if (content[0] === 37 && content[1] === 80) {
            return <iframe src={url} className="w-full h-full border-none" />;
        }
        
        if ((content[0] === 137 && content[1] === 80) || (content[0] === 255 && content[1] === 216)) {
             const imgBlob = new Blob([content as any]);
             const imgUrl = URL.createObjectURL(imgBlob);
             return <img src={imgUrl} className="max-w-full max-h-full object-contain mx-auto" />;
        }

        return (
            <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap p-4 h-full overflow-auto">
                {new TextDecoder().decode(content)}
            </pre>
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
                <Scene3D unlocked={false} />
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
                                <div className="grow bg-white relative flex items-center justify-center">
                                    {renderContent(decryptedContent.content)}
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

                    {status === "SCANNING_NET" || status === "SYSTEM_INIT" ? (
                        <div className="text-center py-32 text-gray-500 space-y-4">
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                                <Loader2 className="w-12 h-12 animate-spin relative z-10 text-rose-500"/>
                            </div>
                            <p className="tracking-[0.2em] text-sm animate-pulse">SCANNING BLOCKCHAIN FOR ASSETS...</p>
                        </div>
                    ) : displayedAssets.length === 0 ? (
                        <div className="text-center py-32 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="p-4 bg-white/5 rounded-full inline-block mb-2">
                                <SearchX className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 tracking-widest">
                                {filterMode === "ALL" ? "NO MARKET ASSETS FOUND" : "LIBRARY EMPTY"}
                            </h3>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                {filterMode === "ALL" 
                                    ? "The marketplace is currently waiting for new deployments. Be the first to mint." 
                                    : "You haven't purchased any secure assets yet."}
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

                                        <div className="absolute top-4 left-4 text-[10px] bg-emerald-950/80 backdrop-blur border border-emerald-500/30 px-2 py-1 rounded flex items-center gap-2 shadow-lg">
                                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                            <span className="text-emerald-400 font-mono tracking-wide">
                                                {asset.creator.slice(0,4)}...{asset.creator.slice(-4)}
                                            </span>
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
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Access Price</p>
                                                <p className="text-xl font-light text-white">{ethers.formatEther(asset.price)} <span className="text-sm text-gray-600">ETH</span></p>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                {account && account.toLowerCase() === asset.creator.toLowerCase() && (
                                                    <button 
                                                        onClick={() => toggleAssetStatus(asset.id)} 
                                                        disabled={loadingId === asset.id}
                                                        className="p-2.5 bg-red-950/30 border border-red-500/30 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                                        title="Deactivate Asset"
                                                    >
                                                        {loadingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
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
                                                        disabled={loadingId === asset.id}
                                                        className="px-5 py-2.5 bg-white text-black text-xs font-bold rounded flex items-center gap-2 hover:bg-gray-200 hover:scale-105 transition-all shadow-lg"
                                                    >
                                                        {loadingId === asset.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <ShoppingBag className="w-3 h-3"/>}
                                                        PURCHASE
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