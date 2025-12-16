"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Upload, FileKey, Shield, CheckCircle, Loader2, AlertOctagon, Terminal, Wallet, ArrowDownToLine, X, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; 
import { CONTRACT_ADDRESS, ABI } from "../../constants";
import { generateKey, encryptFile } from "../../utils/encryption";

declare global {
    interface Window {
        ethereum?: any;
    }
}

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

interface NotificationState {
    type: "success" | "error" | "info";
    title: string;
    message: string;
    txHash?: string;
}

export default function CreateAsset() {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [status, setStatus] = useState("IDLE"); 
  const [logs, setLogs] = useState<string[]>([]);
  const [earnings, setEarnings] = useState("0.0");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => setNotification(null), 6000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    checkEarnings();
  }, []);

  async function checkEarnings() {
    try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const balance = await contract.pendingWithdrawals(address);
        setEarnings(ethers.formatEther(balance));
    } catch (e) {
        console.error("Failed to fetch earnings", e);
    }
  }

  async function handleWithdraw() {
    try {
        setIsWithdrawing(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        const tx = await contract.withdrawFunds();
        
        setNotification({
            type: "info",
            title: "WITHDRAWAL INITIATED",
            message: "Waiting for blockchain confirmation...",
            txHash: tx.hash
        });

        await tx.wait();
        
        setNotification({
            type: "success",
            title: "FUNDS WITHDRAWN",
            message: `${earnings} ETH has been transferred to your wallet.`,
            txHash: tx.hash
        });

        setEarnings("0.0");
    } catch (e: any) {
        setNotification({
            type: "error",
            title: "WITHDRAWAL FAILED",
            message: e.message || "Transaction rejected."
        });
    } finally {
        setIsWithdrawing(false);
    }
  }

  async function uploadToPinata(content: any, filename: string, isJSON = false) {
    if (!PINATA_JWT) throw new Error("Pinata JWT is missing in .env.local!");

    const formData = new FormData();
    if (isJSON) {
        const blob = new Blob([JSON.stringify(content)], { type: "application/json" });
        formData.append("file", blob, filename);
    } else {
        const blob = new Blob([content]);
        formData.append("file", blob, filename);
    }

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", options);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: formData
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Pinata Upload Failed: ${errData.error?.details || res.statusText}`);
    }
    return (await res.json()).IpfsHash;
  }

  async function handleCreate() {
    if (!file || !form.price || !form.title) {
        setNotification({ type: "error", title: "INPUT ERROR", message: "Please fill all fields and select a file." });
        return;
    }
    
    try {
        if (!window.ethereum) throw new Error("No Wallet Found.");
        
        setLogs([]);
        setStatus("ENCRYPTING");
        addLog("Initializing Secure Environment...");
        
        const key = await generateKey();
        addLog(`Encrypting '${file.name}' locally...`);
        const encryptedBytes = await encryptFile(file, key);
        
        setStatus("UPLOADING");
        addLog("Uploading Encrypted Asset to Pinata...");
        const assetCid = await uploadToPinata(encryptedBytes, "encrypted_asset.bin");
        
        addLog("Uploading Metadata...");
        const metadata = {
            name: form.title,
            description: form.description,
            encrypted_content: `ipfs://${assetCid}`,
            image: "ipfs://bafkreidmq5k57c67425746746" 
        };
        const metadataCid = await uploadToPinata(metadata, "metadata.json", true);

        setStatus("MINTING");
        addLog("Requesting Wallet Signature...");
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const priceWei = ethers.parseEther(form.price);
        
        const tx = await contract.createAsset(priceWei, `ipfs://${metadataCid}`, key);
        
        setNotification({
            type: "info",
            title: "MINTING...",
            message: "Transaction sent. Waiting for block...",
            txHash: tx.hash
        });

        addLog(`Tx Sent: ${tx.hash}`);
        await tx.wait();

        setStatus("SUCCESS");
        addLog("✅ ASSET MINTED SUCCESSFULLY!");
        
        setNotification({
            type: "success",
            title: "ASSET DEPLOYED",
            message: "Your secure asset is now live on the marketplace.",
            txHash: tx.hash
        });

        setFile(null);
        setForm({ ...form, title: "", price: "" });

    } catch (err: any) {
        console.error(err);
        addLog(`❌ ERROR: ${err.message}`);
        setStatus("IDLE");
        setNotification({
            type: "error",
            title: "MINTING FAILED",
            message: err.message
        });
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono relative selection:bg-rose-500/30">
        <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>

        <AnimatePresence>
            {notification && (
                <motion.div 
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="fixed top-8 right-6 z-200 w-full max-w-sm"
                >
                    <div className={`
                        relative overflow-hidden rounded-lg border backdrop-blur-xl p-4 shadow-2xl
                        ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 shadow-emerald-900/20' : ''}
                        ${notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 shadow-rose-900/20' : ''}
                        ${notification.type === 'info' ? 'bg-blue-950/90 border-blue-500/50 shadow-blue-900/20' : ''}
                    `}>
                        <div className="flex gap-4">
                            <div className={`mt-1 p-2 rounded-full 
                                ${notification.type === 'success' ? 'bg-emerald-500 text-black' : ''}
                                ${notification.type === 'error' ? 'bg-rose-500 text-white' : ''}
                                ${notification.type === 'info' ? 'bg-blue-500 text-white' : ''}
                            `}>
                                {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
                                {notification.type === 'error' && <AlertOctagon className="w-5 h-5" />}
                                {notification.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold tracking-widest ${
                                    notification.type === 'success' ? 'text-emerald-400' : 
                                    notification.type === 'error' ? 'text-rose-400' : 'text-blue-400'
                                }`}>
                                    {notification.title}
                                </h4>
                                <p className="text-xs text-gray-300 mt-1 wrap-break-word">{notification.message}</p>
                            </div>
                            <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white h-fit">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <motion.div 
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 6, ease: "linear" }}
                            className={`absolute bottom-0 left-0 h-0.5 
                                ${notification.type === 'success' ? 'bg-emerald-500' : ''}
                                ${notification.type === 'error' ? 'bg-rose-500' : ''}
                                ${notification.type === 'info' ? 'bg-blue-500' : ''}
                            `}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col items-center py-12 px-4 md:px-0">
            
            <div className="max-w-3xl w-full space-y-8">
                
                <div className="text-center space-y-2">
                    <div className="inline-block p-4 bg-rose-500/10 rounded-full mb-4 border border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
                        <FileKey className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-linear-to-r from-white to-gray-500">
                        CREATOR_CONSOLE
                    </h1>
                    <p className="text-gray-400">Encrypt. Upload. Monetize.</p>
                </div>
                <div className="bg-emerald-950/20 backdrop-blur-sm border border-emerald-500/30 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>         
                     <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Coins className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-1">Unclaimed Revenue</h3>
                            <p className="text-3xl font-mono text-white tracking-tighter">{earnings} <span className="text-base text-gray-500">ETH</span></p>
                        </div>
                     </div>

                     <button 
                        onClick={handleWithdraw}
                        disabled={earnings === "0.0" || isWithdrawing}
                        className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-widest rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-[0_0_20px_rgba(16,185,129,0.2)] relative z-10"
                    >
                        {isWithdrawing ? <Loader2 className="animate-spin w-4 h-4"/> : <ArrowDownToLine className="w-4 h-4"/>}
                        {isWithdrawing ? "PROCESSING..." : "WITHDRAW FUNDS"}
                    </button>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl space-y-6 shadow-2xl">
                    <div className="group border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:border-rose-500 transition-colors cursor-pointer relative bg-black/20 overflow-hidden">
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="relative z-10 pointer-events-none">
                            <Upload className="w-10 h-10 text-gray-500 group-hover:text-rose-400 mx-auto mb-4 transition-colors group-hover:scale-110 duration-300" />
                            <p className="text-lg font-medium text-gray-300">
                                {file ? <span className="text-emerald-400">{file.name}</span> : "Drop Asset Here"}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">Supports PDF, PNG, JPG, MP4</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 uppercase tracking-widest">Asset Title</label>
                            <input 
                                placeholder="e.g. Exclusive Design Pack"
                                className="w-full bg-black/50 border border-white/10 p-4 rounded-lg text-sm focus:border-rose-500 outline-none focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-gray-700"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 uppercase tracking-widest">Price (ETH)</label>
                            <input 
                                placeholder="0.01"
                                type="number"
                                step="0.001"
                                className="w-full bg-black/50 border border-white/10 p-4 rounded-lg text-sm focus:border-rose-500 outline-none focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-gray-700"
                                value={form.price}
                                onChange={e => setForm({...form, price: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest">Description</label>
                        <textarea 
                            placeholder="Describe what the user is buying..."
                            className="w-full bg-black/50 border border-white/10 p-4 rounded-lg text-sm focus:border-rose-500 outline-none h-32 resize-none focus:ring-1 focus:ring-rose-500 transition-all placeholder:text-gray-700"
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                        />
                    </div>

                    {!PINATA_JWT && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-pulse">
                            <AlertOctagon className="w-5 h-5" />
                            <span>Configuration Error: NEXT_PUBLIC_PINATA_JWT not found in .env.local</span>
                        </div>
                    )}

                    <button 
                        onClick={handleCreate}
                        disabled={status !== "IDLE" || !PINATA_JWT}
                        className="w-full py-5 bg-linear-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-bold tracking-widest rounded-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20"
                    >
                        {status === "IDLE" ? (
                            <>INITIALIZE MINTING PROTOCOL <Shield className="w-5 h-5" /></>
                        ) : status === "SUCCESS" ? (
                            <>DEPLOYMENT COMPLETE <CheckCircle className="w-5 h-5" /></>
                        ) : (
                            <>{status}... <Loader2 className="animate-spin w-5 h-5" /></>
                        )}
                    </button>

                    <div className="bg-black/80 p-6 rounded-lg border border-white/10 font-mono text-xs h-48 overflow-y-auto shadow-inner">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <span className="text-gray-500 flex items-center gap-2"><Terminal className="w-3 h-3"/> SYSTEM LOGS</span>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                        </div>
                        {logs.length === 0 && <span className="text-gray-700 animate-pulse">Waiting for input...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 text-emerald-500/90 border-l-2 border-emerald-500/30 pl-2">
                                {log}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
}