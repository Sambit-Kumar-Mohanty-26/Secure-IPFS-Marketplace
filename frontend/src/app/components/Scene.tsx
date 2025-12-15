"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  Stars, 
  Sparkles, 
  Text, 
  PerspectiveCamera, 
  Icosahedron, 
  MeshTransmissionMaterial, 
  Environment 
} from "@react-three/drei";
import * as THREE from "three";

function Artifact({ unlocked }: { unlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const color = useMemo(() => new THREE.Color(unlocked ? "#10b981" : "#f43f5e"), [unlocked]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.z = t * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Icosahedron args={[1, 15]} ref={meshRef} scale={1.5}>
        <MeshTransmissionMaterial 
          backside
          backsideThickness={1}
          thickness={2}
          roughness={0}
          transmission={1}
          ior={1.5}
          chromaticAberration={1}
          anisotropy={20}
          color={color}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.5}
          toneMapped={false} 
        />
      </Icosahedron>
      
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.2}
        color={unlocked ? "#10b981" : "#f43f5e"}
        anchorX="center"
        anchorY="middle"
      >
        {unlocked ? "STATUS :: DECRYPTED" : "STATUS :: ENCRYPTED"}
      </Text>
    </Float>
  );
}
function Loader() {
  return null; 
}

export default function Scene({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="h-full w-full absolute inset-0">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]} 
      >
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        
        <Suspense fallback={<Loader />}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
            <pointLight position={[-10, -5, -10]} intensity={1} color={unlocked ? "#10b981" : "#f43f5e"} />
            
            <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
            <Sparkles count={40} scale={6} size={2} speed={0.4} opacity={0.4} color="#ffffff" />
            
            <Artifact unlocked={unlocked} />
        </Suspense>
      </Canvas>
    </div>
  );
}