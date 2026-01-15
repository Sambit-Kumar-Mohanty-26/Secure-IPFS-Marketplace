"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  AnimatePresence,
  useInView
} from "framer-motion";
import {
  Fingerprint, ArrowRight, Shield, Zap, Lock, Terminal, Database,
  Globe, Cpu, Layers, Key, Eye, Code2, ChevronRight,
  Activity, Hash, FileCode, CheckCircle2, Command, Network, Share2,
  Box, Radio, Wifi, Crosshair, Scan, Server
} from "lucide-react";

// 1. UTILITY COMPONENTS
const BIOSLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);

  const bootSequence = [
    "INITIALIZING KERNEL...",
    "LOADING CRYPTO MODULES [AES-256-GCM]...",
    "CONNECTING TO IPFS SWARM...",
    "VERIFYING SMART CONTRACT INTEGRITY...",
    "ESTABLISHING SECURE HANDSHAKE...",
    "ACCESS GRANTED."
  ];

  useEffect(() => {
    let delay = 0;
    bootSequence.forEach((line, index) => {
      delay += Math.random() * 300 + 100;
      setTimeout(() => {
        setLines(prev => [...prev, line]);
        if (index === bootSequence.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
    });
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black font-mono text-xs md:text-sm text-emerald-500 p-8 flex flex-col justify-end"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute top-4 left-4 border border-emerald-900/50 p-2 text-emerald-800">
        BIOS v.1.0.4 - OBSIDIAN PROTOCOL
      </div>
      <div className="space-y-1">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="opacity-50">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span>
            <span>{l}</span>
          </div>
        ))}
        <span className="animate-pulse">_</span>
      </div>
    </motion.div>
  );
};

// --- PARTICLE NETWORK ---
const ParticleNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles: { x: number, y: number, vx: number, vy: number }[] = [];
    const properties = {
      bgColor: 'rgba(5, 5, 5, 1)',
      particleColor: 'rgba(16, 185, 129, 0.5)',
      particleRadius: 1.5,
      particleCount: 60,
      lineLength: 150,
      particleLife: 6
    };

    for (let i = 0; i < properties.particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }

    function reDrawBackground() {
      ctx!.fillStyle = properties.bgColor;
      ctx!.clearRect(0, 0, w, h);
    }

    function drawParticles() {
      for (let i in particles) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx!.fillStyle = properties.particleColor;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, properties.particleRadius, 0, Math.PI * 2);
        ctx!.closePath();
        ctx!.fill();
      }
    }

    function drawLines() {
      let x1, y1, x2, y2, length, opacity;
      for (let i in particles) {
        for (let j in particles) {
          x1 = particles[i].x;
          y1 = particles[i].y;
          x2 = particles[j].x;
          y2 = particles[j].y;
          length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          if (length < properties.lineLength) {
            opacity = 1 - length / properties.lineLength;
            ctx!.lineWidth = 0.5;
            ctx!.strokeStyle = 'rgba(16, 185, 129, ' + opacity + ')';
            ctx!.beginPath();
            ctx!.moveTo(x1, y1);
            ctx!.lineTo(x2, y2);
            ctx!.closePath();
            ctx!.stroke();
          }
        }
      }
    }

    function loop() {
      reDrawBackground();
      drawParticles();
      drawLines();
      requestAnimationFrame(loop);
    }

    const init = () => { loop(); }
    init();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-40" />;
}

// --- Decrypt Text Effect---
const DecryptText = ({ text, className, speed = 30, trigger = true }: { text: string, className?: string, speed?: number, trigger?: boolean }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

  useEffect(() => {
    if (!trigger) return;
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text.split("").map((letter, index) => {
          if (index < iterations) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (iterations >= text.length) clearInterval(interval);
      iterations += 1 / 3;
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, trigger]);

  return <span className={className}>{displayText}</span>;
};

// --- Magnetic Buttons ---
const MagneticButton = ({ children, className, onClick, href }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    x.set((clientX - (left + width / 2)) * 0.35);
    y.set((clientY - (top + height / 2)) * 0.35);
  };

  const reset = () => { x.set(0); y.set(0); };

  const Content = (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );

  return href ? <Link href={href}>{Content}</Link> : <div onClick={onClick}>{Content}</div>;
};

// --- Transaction Sidebar ---
const LiveFeed = () => {
  const [txs, setTxs] = useState<{ hash: string, type: string }[]>([]);

  useEffect(() => {
    const types = ["MINT", "DECRYPT", "TRANSFER", "VERIFY"];
    const interval = setInterval(() => {
      const hash = "0x" + Math.random().toString(16).substr(2, 8) + "...";
      const type = types[Math.floor(Math.random() * types.length)];
      setTxs(prev => [{ hash, type }, ...prev.slice(0, 4)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed right-6 bottom-20 z-30 hidden xl:flex flex-col gap-2 items-end pointer-events-none">
      <div className="text-[10px] font-mono text-gray-500 mb-2 flex items-center gap-2">
        <Activity className="w-3 h-3" /> LIVE_MEMPOOL
      </div>
      <AnimatePresence>
        {txs.map((tx, i) => (
          <motion.div
            key={tx.hash}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-black/80 backdrop-blur border border-white/10 p-2 rounded text-[10px] font-mono flex items-center gap-3 w-48"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'MINT' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-gray-300 flex-1">{tx.hash}</span>
            <span className="text-gray-500">{tx.type}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[990] opacity-[0.04] pointer-events-none mix-blend-overlay"
    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}>
  </div>
);


const Scanlines = () => (
  <div className="fixed inset-0 z-[980] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
);

// --- Cursor ---
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
};

const CustomCursor = () => {
  const { x, y } = useMousePosition();
  return (
    <>
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:flex items-center justify-center"
        animate={{ x: x - 24, y: y - 24 }}
        transition={{ type: "spring", stiffness: 800, damping: 35 }}
      >
        <div className="w-12 h-12 relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute w-full h-full rounded-full border border-dashed border-emerald-500/30"
          />
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500"></div>
          <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
        </div>
      </motion.div>

      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        animate={{ x: x + 20, y: y + 20 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      >
        <div className="flex flex-col text-[8px] font-mono text-emerald-500/70 bg-black/60 backdrop-blur px-1 border-l border-emerald-500/50">
          <span>X: {x.toString().padStart(4, '0')}</span>
          <span>Y: {y.toString().padStart(4, '0')}</span>
        </div>
      </motion.div>
    </>
  );
};


// Hexagon SVG Component
const HexagonNode = ({ isActive, color, size = 60 }: { isActive: boolean; color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className="transition-all duration-500">
    <defs>
      <filter id={`glow-${color}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <stop offset="100%" stopColor={color} stopOpacity="0.3" />
      </linearGradient>
    </defs>
    <polygon
      points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
      fill={isActive ? `url(#gradient-${color})` : "rgba(255,255,255,0.02)"}
      stroke={color}
      strokeWidth={isActive ? "2" : "1"}
      filter={isActive ? `url(#glow-${color})` : "none"}
      className="transition-all duration-700"
    />
    <polygon
      points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5"
      fill="none"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity="0.3"
    />
  </svg>
);

// Orbital Ring Component
const OrbitalRing = ({ radius, rotation, duration, color, dotCount = 6 }: { radius: number; rotation: number; duration: number; color: string; dotCount?: number }) => (
  <motion.div
    className="absolute rounded-full border border-white/5"
    style={{
      width: radius * 2,
      height: radius * 2,
      left: `calc(50% - ${radius}px)`,
      top: `calc(50% - ${radius}px)`,
    }}
    animate={{ rotate: rotation }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  >
    {Array.from({ length: dotCount }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 10px ${color}`,
          left: `calc(50% + ${radius * Math.cos((2 * Math.PI * i) / dotCount)}px - 3px)`,
          top: `calc(50% + ${radius * Math.sin((2 * Math.PI * i) / dotCount)}px - 3px)`,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.3
        }}
      />
    ))}
  </motion.div>
);

// Data Flow Particle
const DataFlowParticle = ({ delay, angle, color }: { delay: number; angle: number; color: string }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      left: "50%",
      top: "50%",
    }}
    animate={{
      x: [0, Math.cos(angle * Math.PI / 180) * 300],
      y: [0, Math.sin(angle * Math.PI / 180) * 300],
      opacity: [0, 1, 1, 0],
      scale: [0.5, 1.5, 1, 0.3],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      delay,
      ease: "easeOut",
    }}
  />
);

// Architecture Card
const ArchitectureCard = ({ data, index, isVisible }: { data: any; index: number; isVisible: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colors: { [key: string]: string } = {
    emerald: "#10b981",
    blue: "#3b82f6",
    rose: "#f43f5e",
    purple: "#a855f7"
  };

  const cardColor = colors[data.accent] || colors.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 30,
      }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group"
    >
      {/* The Card */}
      <motion.div
        className="relative backdrop-blur-xl border rounded-2xl overflow-hidden cursor-pointer h-full"
        style={{
          background: isHovered
            ? `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(${data.accent === 'emerald' ? '16,185,129' : data.accent === 'blue' ? '59,130,246' : data.accent === 'rose' ? '244,63,94' : '168,85,247'},0.15) 100%)`
            : "rgba(0,0,0,0.6)",
          borderColor: isHovered ? cardColor : "rgba(255,255,255,0.1)",
          boxShadow: isHovered ? `0 0 30px ${cardColor}30` : "none",
        }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Scan Line Effect */}
        <motion.div
          className="absolute inset-x-0 h-[1px] pointer-events-none opacity-50"
          style={{ background: `linear-gradient(90deg, transparent, ${cardColor}, transparent)` }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: index * 0.3 }}
        />

        {/* Content */}
        <div className="relative p-5 z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-2.5 rounded-xl border"
              style={{
                background: `${cardColor}15`,
                borderColor: `${cardColor}40`,
                color: cardColor
              }}
            >
              {data.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${cardColor}20`, color: cardColor }}
                >
                  NODE_0{index + 1}
                </span>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cardColor }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h3 className="text-base font-bold text-white">{data.title}</h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-xs leading-relaxed">{data.desc}</p>

          {/* Status Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-mono text-gray-500">ACTIVE</span>
            </div>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded"
              style={{ background: `${cardColor}15`, color: cardColor }}
            >
              {isHovered ? "INSPECT" : "READY"}
            </span>
          </div>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l rounded-tl" style={{ borderColor: `${cardColor}50` }} />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r rounded-tr" style={{ borderColor: `${cardColor}50` }} />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l rounded-bl" style={{ borderColor: `${cardColor}50` }} />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r rounded-br" style={{ borderColor: `${cardColor}50` }} />
      </motion.div>
    </motion.div>
  );
};

// Central Core Component
const CentralCore = ({ isActive }: { isActive: boolean }) => (
  <motion.div
    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
    animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    {/* Outer Glow Ring */}
    <motion.div
      className="absolute -inset-8 rounded-full"
      style={{
        background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)",
      }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 3, repeat: Infinity }}
    />

    {/* Core Hexagon */}
    <div className="relative">
      <HexagonNode isActive={true} color="#10b981" size={100} />

      {/* Inner Icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-emerald-400"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Cpu className="w-10 h-10" />
      </motion.div>

      {/* Pulsing Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-emerald-500/30"
          style={{
            transform: `scale(${1 + i * 0.3})`,
          }}
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1 + i * 0.3, 1.5 + i * 0.3, 1 + i * 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5
          }}
        />
      ))}
    </div>

    {/* Status Label */}
    <motion.div
      className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="text-[10px] font-mono text-emerald-400 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-emerald-500/30">
        ⬡ CORE_PROCESSOR_ACTIVE
      </span>
    </motion.div>
  </motion.div>
);

// 4. MAIN INTERFACE (The Site Content)
const MainInterface = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yHero = useTransform(scrollYProgress, [0, 0.5], [0, -150]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const archRef = useRef(null);
  const archInView = useInView(archRef, { amount: 0.3 });
  const { scrollYProgress: scrollArch } = useScroll({
    target: archRef,
    offset: ["start start", "end end"]
  });

  const cards = [
    {
      title: "Client-Side Encryption",
      desc: "Files are encrypted in browser memory using Web Crypto API. No server ever sees the unencrypted bytes.",
      icon: <Lock className="w-5 h-5" />,
      accent: "emerald"
    },
    {
      title: "IPFS Distribution",
      desc: "Encrypted blobs are pinned to the IPFS network, creating a censorship-resistant, permanent storage layer.",
      icon: <Database className="w-5 h-5" />,
      accent: "blue"
    },
    {
      title: "Smart Royalties",
      desc: "ERC-2981 Standard implementation ensures creators earn perpetual revenue on every secondary sale.",
      icon: <Zap className="w-5 h-5" />,
      accent: "rose"
    },
    {
      title: "Secure Rendering",
      desc: "Secure in-memory decryption allows for 4K streaming and HD audio without downloading files to disk.",
      icon: <Eye className="w-5 h-5" />,
      accent: "purple"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-rose-500/30 overflow-x-hidden cursor-none">

      <CustomCursor />
      <ParticleNetwork />
      <NoiseOverlay />
      <Scanlines />
      <LiveFeed />

      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-rose-500 to-purple-500 origin-left z-[1000]" style={{ scaleX }} />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[900] px-6 py-6 flex justify-between items-center backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
            <Fingerprint className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-sm font-bold tracking-[0.3em] font-mono">OBSIDIAN_VAULT</span>
        </div>

        <Link href="/market">
          <MagneticButton className="px-6 py-2 bg-white text-black font-bold text-xs tracking-widest rounded-sm hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            INITIALIZE_APP
          </MagneticButton>
        </Link>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
        <motion.div
          style={{ y: yHero, opacity: opacityHero }}
          className="z-10 text-center space-y-10 max-w-6xl"
        >
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 px-3 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-mono text-emerald-400">
              <Wifi className="w-3 h-3 animate-pulse" />
              SECURE CONNECTION ESTABLISHED
            </div>
          </div>

          <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter leading-[0.85] select-none">
            <div className="flex justify-center gap-4">
              <span className="text-white mix-blend-difference">TRUE</span>
            </div>
            <div className="flex justify-center gap-4 relative">
              <span className="text-white/20 absolute top-1 left-1 blur-[1px] pr-4">OWNERSHIP</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 pr-4">
                OWNERSHIP
              </span>
            </div>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light font-mono">
            /protocol: <span className="text-emerald-400">AES-256-GCM</span><br />
            /storage: <span className="text-blue-400">IPFS_SWARM</span><br />
            /status: <span className="text-rose-400">UNBREAKABLE</span>
          </p>

          <div className="flex justify-center pt-10">
            <Link href="/market">
              <button className="group relative px-12 py-5 bg-white text-black font-bold text-sm tracking-widest overflow-hidden transition-all hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">ENTER VAULT <ArrowRight className="w-4 h-4" /></span>
                <div className="absolute inset-0 bg-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="relative py-32 md:py-56 bg-black overflow-hidden">

        <div className="absolute inset-0 overflow-hidden">

          <motion.div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 20% 40%, rgba(244, 63, 94, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 70% 50% at 50% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
              `
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute w-[800px] h-[800px] rounded-full blur-[180px]"
            style={{
              background: "radial-gradient(circle, rgba(244, 63, 94, 0.25) 0%, rgba(244, 63, 94, 0.05) 50%, transparent 70%)",
              left: "-20%",
              top: "10%"
            }}
            animate={{
              x: [0, 100, 50, 0],
              y: [0, 50, 100, 0],
              scale: [1, 1.2, 0.9, 1],
              rotate: [0, 45, -20, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute w-[700px] h-[700px] rounded-full blur-[150px]"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)",
              right: "-15%",
              bottom: "20%"
            }}
            animate={{
              x: [0, -80, -40, 0],
              y: [0, -60, 80, 0],
              scale: [1, 0.8, 1.3, 1],
              rotate: [0, -30, 45, 0]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)",
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Floating Particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                background: i % 3 === 0 ? "rgba(244, 63, 94, 0.6)" : i % 3 === 1 ? "rgba(59, 130, 246, 0.6)" : "rgba(168, 85, 247, 0.6)",
                boxShadow: i % 3 === 0 ? "0 0 10px rgba(244, 63, 94, 0.5)" : i % 3 === 1 ? "0 0 10px rgba(59, 130, 246, 0.5)" : "0 0 10px rgba(168, 85, 247, 0.5)",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: Math.random() * 8 + 6,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* Grid with Perspective */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'center top'
            }}
          />

          <motion.div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), rgba(59, 130, 246, 0.4), transparent)",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1 }}
            className="text-center mb-32"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="mb-12 inline-block"
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 rounded-full opacity-70"
                  style={{
                    background: "linear-gradient(90deg, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.3), rgba(244, 63, 94, 0.3))"
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <div className="relative flex items-center gap-4 px-8 py-4 rounded-full border border-emerald-500/30 bg-black/80 backdrop-blur-xl">
                  <motion.span
                    className="w-3 h-3 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.8)" }}
                  />
                  <span className="text-emerald-400 font-mono text-sm tracking-[0.3em] font-bold">FOR THE CREATORS</span>
                  <motion.div
                    className="flex gap-1"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4 md:space-y-6">
              {[
                { text: "Your art was", highlight: "stolen.", color: "rose", glowColor: "rgba(244, 63, 94, 0.5)", delay: 0.1 },
                { text: "Your music was", highlight: "pirated.", color: "blue", glowColor: "rgba(59, 130, 246, 0.5)", delay: 0.3 },
                { text: "Your work was", highlight: "undervalued.", color: "purple", glowColor: "rgba(168, 85, 247, 0.5)", delay: 0.5 }
              ].map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100, rotateY: 30 }}
                  whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: line.delay, type: "spring", stiffness: 50 }}
                  className="relative"
                >
                  <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight">
                    <span className="text-white/90">{line.text} </span>
                    <motion.span
                      className={`relative inline-block text-transparent bg-clip-text bg-gradient-to-r 
                        ${line.color === 'rose' ? 'from-rose-400 via-rose-500 to-rose-600' : ''}
                        ${line.color === 'blue' ? 'from-blue-400 via-blue-500 to-blue-600' : ''}
                        ${line.color === 'purple' ? 'from-purple-400 via-purple-500 to-purple-600' : ''}
                      `}
                      whileHover={{ scale: 1.05 }}
                      style={{
                        filter: `drop-shadow(0 0 40px ${line.glowColor})`,
                      }}
                    >
                      {line.highlight}
                      <motion.div
                        className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${line.glowColor}, transparent)`,
                        }}
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: line.delay + 0.5 }}
                      />
                    </motion.span>
                  </h2>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 1, type: "spring", stiffness: 80 }}
              className="mt-16 relative inline-block"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-32 h-[2px] origin-left"
                  style={{
                    rotate: `${i * 30}deg`,
                    background: "linear-gradient(90deg, rgba(16, 185, 129, 0.5), transparent)"
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: [0, 1, 0] }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 1.2 + i * 0.05 }}
                />
              ))}

              <motion.span
                className="relative text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500"
                style={{
                  filter: "drop-shadow(0 0 60px rgba(16, 185, 129, 0.7))",
                }}
                animate={{
                  textShadow: [
                    "0 0 20px rgba(16, 185, 129, 0.5)",
                    "0 0 40px rgba(16, 185, 129, 0.8)",
                    "0 0 20px rgba(16, 185, 129, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Not anymore.
              </motion.span>
            </motion.div>
          </motion.div>

          <div className="relative mb-32" style={{ perspective: "2000px" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {[
                {
                  icon: "🎨",
                  title: "Digital Artists",
                  desc: "Tired of right-click savers? Your art stays encrypted until purchased. No screenshots. No theft.",
                  color: "rose",
                  rgb: "244, 63, 94",
                  symbol: "ART"
                },
                {
                  icon: "🎵",
                  title: "Musicians & Producers",
                  desc: "Every stream, every download, every remix—you get paid. Forever. On-chain royalties that can't be bypassed.",
                  color: "blue",
                  rgb: "59, 130, 246",
                  symbol: "SND"
                },
                {
                  icon: "🎬",
                  title: "Filmmakers & Creators",
                  desc: "Premium 4K content, streamed securely. Your audience pays, pirates get nothing but encrypted noise.",
                  color: "purple",
                  rgb: "168, 85, 247",
                  symbol: "VID"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 80, rotateX: 45 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.2, type: "spring", stiffness: 60 }}
                  whileHover={{
                    y: -20,
                    rotateY: 5,
                    rotateX: -5,
                    scale: 1.02,
                    transition: { duration: 0.4 }
                  }}
                  className="group relative"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="absolute -inset-[3px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                    style={{ background: `rgba(${item.rgb}, 0.4)` }}
                  />
                  <div
                    className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, rgba(${item.rgb}, 0.5), transparent, rgba(${item.rgb}, 0.3))`,
                    }}
                  />

                  <div
                    className="relative h-full overflow-hidden rounded-3xl border border-white/10 group-hover:border-transparent transition-all duration-500"
                    style={{
                      background: "linear-gradient(180deg, rgba(15, 15, 15, 0.95) 0%, rgba(5, 5, 5, 0.98) 100%)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{
                        background: `
                          linear-gradient(90deg, transparent 0%, rgba(${item.rgb}, 0.5) 50%, transparent 100%)
                        `,
                        backgroundSize: "200% 100%"
                      }}
                      animate={{ backgroundPositionX: ["200%", "-200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="absolute inset-[1px] rounded-3xl" style={{ background: "rgba(5,5,5,0.98)" }} />
                    </motion.div>

                    <motion.div
                      className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, rgba(${item.rgb}, 0.8), transparent)` }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.2 + 0.5 }}
                    />

                    <div className="relative p-8 lg:p-10 z-10">
                      <div className="flex items-start justify-between mb-8">
                        <motion.div
                          className="relative"
                          whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                        >
                          <div
                            className="relative w-20 h-20 rounded-2xl flex items-center justify-center border"
                            style={{
                              background: `linear-gradient(135deg, rgba(${item.rgb}, 0.15), rgba(${item.rgb}, 0.05))`,
                              borderColor: `rgba(${item.rgb}, 0.3)`,
                              boxShadow: `0 0 30px rgba(${item.rgb}, 0.2)`
                            }}
                          >
                            <span className="text-5xl">{item.icon}</span>

                            <motion.div
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                background: `rgba(${item.rgb}, 1)`,
                                boxShadow: `0 0 10px rgba(${item.rgb}, 0.8)`
                              }}
                              animate={{
                                rotate: 360,
                              }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              initial={{ x: 40 }}
                            />
                          </div>
                        </motion.div>

                        <div
                          className="px-3 py-1.5 rounded-full border font-mono text-[10px] tracking-wider"
                          style={{
                            borderColor: `rgba(${item.rgb}, 0.4)`,
                            color: `rgba(${item.rgb}, 1)`,
                            background: `rgba(${item.rgb}, 0.1)`
                          }}
                        >
                          {item.symbol}_PROTECTED
                        </div>
                      </div>

                      <h3
                        className="text-3xl font-bold mb-4"
                        style={{
                          background: `linear-gradient(135deg, white, rgba(${item.rgb}, 0.8))`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent"
                        }}
                      >
                        {item.title}
                      </h3>

                      <p className="text-gray-400 leading-relaxed text-lg mb-8">{item.desc}</p>

                      <div
                        className="pt-6 border-t flex items-center justify-between"
                        style={{ borderColor: `rgba(${item.rgb}, 0.15)` }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: "#10b981", boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)" }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span className="text-xs font-mono text-gray-500 tracking-wide">ENCRYPTION ACTIVE</span>
                        </div>

                        <motion.div
                          className="flex items-center gap-2 text-xs font-mono cursor-pointer"
                          style={{ color: `rgba(${item.rgb}, 0.8)` }}
                          whileHover={{ x: 5 }}
                        >
                          <span>LEARN MORE</span>
                          <ChevronRight className="w-3 h-3" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Corner Accents */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 rounded-tl opacity-30" style={{ borderColor: `rgba(${item.rgb}, 1)` }} />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 rounded-tr opacity-30" style={{ borderColor: `rgba(${item.rgb}, 1)` }} />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 rounded-bl opacity-30" style={{ borderColor: `rgba(${item.rgb}, 1)` }} />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 rounded-br opacity-30" style={{ borderColor: `rgba(${item.rgb}, 1)` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div
              className="absolute -inset-10 rounded-[3rem] blur-3xl opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))"
              }}
            />

            <div
              className="relative p-12 md:p-16 lg:p-20 rounded-[2rem] border border-white/10 overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%)",
                backdropFilter: "blur(30px)"
              }}
            >
              {[
                { pos: "top-0 left-0", border: "border-t-2 border-l-2", translate: "" },
                { pos: "top-0 right-0", border: "border-t-2 border-r-2", translate: "" },
                { pos: "bottom-0 left-0", border: "border-b-2 border-l-2", translate: "" },
                { pos: "bottom-0 right-0", border: "border-b-2 border-r-2", translate: "" }
              ].map((corner, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${corner.pos} w-16 h-16 ${corner.border} ${corner.translate}`}
                  style={{ borderColor: "rgba(16, 185, 129, 0.5)" }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                />
              ))}

              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span
                  className="text-9xl font-serif"
                  style={{
                    background: "linear-gradient(180deg, rgba(16, 185, 129, 0.4), transparent)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  "
                </span>
              </motion.div>

              <motion.p
                className="text-2xl md:text-3xl lg:text-4xl text-center leading-relaxed max-w-4xl mx-auto mb-14 font-light"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <span className="text-gray-300">We built this for everyone who ever had their work</span>
                <motion.span
                  className="text-rose-400 font-semibold"
                  whileHover={{ scale: 1.1 }}
                  style={{ display: "inline-block", filter: "drop-shadow(0 0 20px rgba(244, 63, 94, 0.5))" }}
                > stolen</motion.span>
                <span className="text-gray-300">,</span>
                <motion.span
                  className="text-blue-400 font-semibold"
                  whileHover={{ scale: 1.1 }}
                  style={{ display: "inline-block", filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))" }}
                > devalued</motion.span>
                <span className="text-gray-300">, or</span>
                <motion.span
                  className="text-purple-400 font-semibold"
                  whileHover={{ scale: 1.1 }}
                  style={{ display: "inline-block", filter: "drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))" }}
                > controlled by middlemen</motion.span>
                <span className="text-gray-300">.</span>
              </motion.p>

              <motion.div
                className="text-center mb-14"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <span
                  className="text-3xl md:text-4xl lg:text-5xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #fff, #10b981)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 30px rgba(16, 185, 129, 0.4))"
                  }}
                >
                  This is your vault. Your rules. Your revenue.
                </span>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-5">
                {[
                  { text: "100% Creator Ownership", rgb: "16, 185, 129" },
                  { text: "Perpetual Royalties", rgb: "59, 130, 246" },
                  { text: "Zero Platform Fees", rgb: "244, 63, 94" }
                ].map((prop, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 + i * 0.15 }}
                    whileHover={{
                      scale: 1.08,
                      boxShadow: `0 0 40px rgba(${prop.rgb}, 0.5)`,
                    }}
                    className="relative px-8 py-4 rounded-full font-mono text-sm cursor-pointer overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, rgba(${prop.rgb}, 0.15), rgba(${prop.rgb}, 0.05))`,
                      border: `1px solid rgba(${prop.rgb}, 0.4)`,
                      color: `rgba(${prop.rgb}, 1)`,
                    }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(90deg, transparent, rgba(${prop.rgb}, 0.3), transparent)`,
                        transform: "skewX(-20deg)"
                      }}
                      animate={{ x: ["-200%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                    />
                    <span className="relative z-10 font-semibold tracking-wide">{prop.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- Architecture Overview --- */}
      <section ref={archRef} className="relative py-24 md:py-32 bg-gradient-to-b from-[#030303] via-[#050505] to-[#030303]">

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full">
              <defs>
                <pattern id="hexGrid" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                  <polygon
                    points="30,0 60,15 60,37 30,52 0,37 0,15"
                    fill="none"
                    stroke="rgba(16,185,129,0.5)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexGrid)" />
            </svg>
          </div>

          {/* Floating Particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">

          {/* Section Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: archInView ? 1 : 0, y: archInView ? 0 : 20 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-black/50 backdrop-blur-sm mb-6"
              animate={{ borderColor: ["rgba(16,185,129,0.3)", "rgba(59,130,246,0.3)", "rgba(244,63,94,0.3)", "rgba(16,185,129,0.3)"] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Network className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono text-gray-400">SYSTEM_TOPOLOGY v2.0</span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
              Architecture Overview
            </h2>
            <p className="text-gray-500 font-mono text-sm max-w-xl mx-auto">
              Four interconnected layers powering secure, decentralized digital asset trading
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {cards.map((card, i) => (
              <ArchitectureCard
                key={i}
                data={card}
                index={i}
                isVisible={archInView}
              />
            ))}
          </div>

          {/* Bottom Status */}
          <motion.div
            className="flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: archInView ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-black/50 backdrop-blur border border-white/5">
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-500"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                4 NODES ACTIVE
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                <Share2 className="w-3 h-3 text-blue-400" />
                MESH CONNECTED
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                ALL SYSTEMS OPERATIONAL
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* --- Code demo--- */}
      <section className="py-32 px-6 bg-[#080808] border-y border-white/5 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Verifiable Logic</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="mt-1 p-2 bg-emerald-500/10 rounded"><Shield className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <h4 className="text-xl font-bold">Trustless</h4>
                  <p className="text-gray-400 text-sm mt-1">The marketplace operator cannot decrypt your files or steal your funds. Logic is immutable.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="mt-1 p-2 bg-blue-500/10 rounded"><Globe className="w-6 h-6 text-blue-500" /></div>
                <div>
                  <h4 className="text-xl font-bold">Open Source</h4>
                  <p className="text-gray-400 text-sm mt-1">Every line of code is available on GitHub for audit. No hidden backdoors.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-rose-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-black border border-white/10 rounded-lg p-6 font-mono text-xs md:text-sm overflow-hidden shadow-2xl">
              <div className="flex gap-2 mb-4 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-gray-300 space-y-2">
                <p><span className="text-purple-400">const</span> <span className="text-blue-400">encrypt</span> = <span className="text-yellow-300">async</span> (file, key) {`=>`} {'{'}</p>
                <p className="pl-4"><span className="text-gray-500">// Native Browser Crypto API</span></p>
                <p className="pl-4"><span className="text-purple-400">const</span> iv = window.crypto.getRandomValues(<span className="text-orange-400">new Uint8Array(12)</span>);</p>
                <p className="pl-4"><span className="text-purple-400">return</span> window.crypto.subtle.encrypt(</p>
                <p className="pl-8">{`{ name: "AES-GCM", iv }`},</p>
                <p className="pl-8">key,</p>
                <p className="pl-8">fileBuffer</p>
                <p className="pl-4">);</p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---Terminal Footer--- */}
      <footer className="relative py-20 px-6 bg-black relative z-10">
        <div className="max-w-5xl mx-auto border border-white/10 bg-[#0c0c0c] rounded-lg overflow-hidden shadow-2xl">
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-mono text-gray-500">root@obsidian:~</span>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
          <div className="p-8 font-mono text-sm space-y-2">
            <p className="text-gray-500">Last login: {new Date().toLocaleString()} on ttys001</p>
            <div className="flex gap-2">
              <span className="text-emerald-500">➜</span>
              <span className="text-blue-400">~</span>
              <span className="text-white">init_uplink</span>
            </div>
            <p className="text-gray-400 pl-4"> Establishing connection to Sepolia...</p>
            <p className="text-gray-400 pl-4"> Verifying encryption modules...</p>
            <p className="text-emerald-500 pl-4"> READY.</p>
            <br />
            <div className="flex gap-2 items-center">
              <span className="text-emerald-500">➜</span>
              <Link href="/market" className="text-white hover:text-emerald-400 hover:underline decoration-emerald-500 underline-offset-4">
                [ EXECUTE_ENTER_MARKET ]
              </Link>
              <span className="w-2 h-4 bg-white animate-pulse"></span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-600 font-mono">
          <p className="mb-4">BUILT WITH 💎 CLARITY & ⚡ SPEED</p>
          <div className="flex justify-center gap-6">
            <Link href="#" className="hover:text-white transition">GITHUB</Link>
            <Link href="#" className="hover:text-white transition">TWITTER</Link>
            <Link href="#" className="hover:text-white transition">DOCUMENTATION</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
// Footer

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <AnimatePresence>
        {loading && <BIOSLoader onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && <MainInterface />}
    </>
  );
}