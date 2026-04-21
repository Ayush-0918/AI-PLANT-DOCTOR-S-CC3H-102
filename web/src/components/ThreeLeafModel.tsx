'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Sparkles, Html } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

function HologramLeaf() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={[1, 2.2, 0.15]}>
        {/* A stylized geometric leaf base */}
        <sphereGeometry args={[1, 32, 16]} />
        <meshPhysicalMaterial 
           color="#10b981" 
           transparent 
           opacity={0.3} 
           roughness={0.1} 
           transmission={0.9} 
           thickness={0.5} 
           wireframe={true}
        />
        
        {/* Core Stem glowing line */}
        <mesh position={[0, 0, 0]} scale={[0.02, 2.2, 0.5]}>
           <boxGeometry args={[1, 1, 1]} />
           <meshBasicMaterial color="#34d399" />
        </mesh>

        {/* Infected Hotspot Sphere */}
        <mesh position={[0.4, 0.3, 1]} scale={[0.2, 0.1, 1]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshBasicMaterial color="#ef4444" wireframe />
           <Html center>
              <div className="animate-pulse rounded-[1rem] border border-rose-500/50 bg-rose-500/20 p-2 backdrop-blur-md flex items-center justify-center relative">
                 <div className="h-2 w-2 rounded-full bg-rose-500" />
                 <div className="absolute top-full mt-2 min-w-max flex flex-col items-center">
                    <div className="h-4 w-px bg-gradient-to-b from-rose-500 to-transparent" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400 bg-black/60 px-2 py-1 rounded-full border border-rose-500/30">
                       Target Application Zone
                    </p>
                 </div>
              </div>
           </Html>
        </mesh>

        {/* Normal Zone Sphere */}
        <mesh position={[-0.3, -0.5, 0.5]} scale={[0.15, 0.08, 1]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshBasicMaterial color="#3b82f6" wireframe />
           <Html center>
              <div className="rounded-[1rem] border border-blue-500/50 bg-blue-500/10 p-1.5 backdrop-blur-md">
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              </div>
           </Html>
        </mesh>

      </mesh>
    </Float>
  );
}

export default function ThreeLeafModel() {
  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 4.5] }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#a7f3d0" />
        
        <HologramLeaf />
        
        <Sparkles count={80} scale={4} size={3} speed={0.4} opacity={0.7} color="#34d399" />
        <Sparkles count={30} scale={2} size={2} speed={0.8} opacity={0.9} color="#ef4444" position={[0.4, 0.3, 0]} />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} maxPolarAngle={Math.PI/2 + 0.2} minPolarAngle={Math.PI/2 - 0.2} />
      </Canvas>
    </div>
  );
}
