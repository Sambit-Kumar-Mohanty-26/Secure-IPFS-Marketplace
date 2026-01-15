"use client";

import { useRef, useMemo, Suspense, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  Stars, 
  Text, 
  PerspectiveCamera, 
  Icosahedron, 
  MeshTransmissionMaterial, 
  Environment 
} from "@react-three/drei";
import * as THREE from "three";

const MATERIAL_CONFIG = {
  thickness: 2,
  roughness: 0,
  transmission: 1,
  ior: 1.2,
  chromaticAberration: 0.5,
  anisotropy: 10,
  distortion: 0.2,
  distortionScale: 0.3,
  temporalDistortion: 0.1,
  samples: 6, 
  resolution: 512, 
};

function Artifact({ unlocked }: { unlocked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(unlocked ? "#10b981" : "#f43f5e"), [unlocked]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.3;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Icosahedron args={[1, 0]} ref={meshRef} scale={1.5}>
        <MeshTransmissionMaterial 
          {...MATERIAL_CONFIG}
          background={new THREE.Color("#000")}
          color={color}
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

function SceneComponent({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="h-full w-full absolute inset-0">
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 1.5]} 
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <Suspense fallback={null}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
            <pointLight position={[-10, -5, -10]} intensity={1} color={unlocked ? "#10b981" : "#f43f5e"} />
            
            <Stars 
                radius={100}
                depth={50} 
                count={5000}
                factor={6}
                saturation={0} 
                fade 
                speed={1} 
            />
            
            <Artifact unlocked={unlocked} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default memo(SceneComponent);