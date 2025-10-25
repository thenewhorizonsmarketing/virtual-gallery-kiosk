import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function OfficeRoom() {
  const clockRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (clockRef.current) {
      // Rotate clock hand
      clockRef.current.rotation.z = -state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <>
      {/* Office Lighting - Warm professional */}
      <ambientLight intensity={0.6} color="#F5F1E8" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.3}
        color="#FFF8E7"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-5, 2.5, 0]} intensity={0.6} color="#FFE4B5" distance={8} />

      {/* Floor - Carpeted */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#7A6F5D" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Walls - Professional beige */}
      <mesh position={[0, 4, -12.5]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.85} />
      </mesh>
      <mesh position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.85} />
      </mesh>
      <mesh position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.85} />
      </mesh>

      {/* Ceiling with crown molding */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#F5F1E8" roughness={0.8} />
      </mesh>

      {/* Executive Desk */}
      <group position={[0, 0, -8]}>
        {/* Desktop */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[5, 0.12, 2.5]} />
          <meshStandardMaterial color="#4A3728" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Drawers left */}
        <mesh position={[-1.5, 0.35, 0]} castShadow>
          <boxGeometry args={[1.5, 0.6, 2]} />
          <meshStandardMaterial color="#5C4A3A" roughness={0.5} />
        </mesh>
        {/* Drawers right */}
        <mesh position={[1.5, 0.35, 0]} castShadow>
          <boxGeometry args={[1.5, 0.6, 2]} />
          <meshStandardMaterial color="#5C4A3A" roughness={0.5} />
        </mesh>
        {/* Handles */}
        {[-1.5, 1.5].map((x, i) => (
          <mesh key={i} position={[x, 0.4, 1.05]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
            <meshStandardMaterial color="#B8860B" roughness={0.2} metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Leather Executive Chair */}
      <group position={[0, 0, -5.5]}>
        {/* Seat */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#2C1810" roughness={0.4} />
        </mesh>
        {/* Back */}
        <mesh position={[0, 1.3, -0.5]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 1.4, 0.15]} />
          <meshStandardMaterial color="#2C1810" roughness={0.4} />
        </mesh>
        {/* Base star */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              position={[Math.cos(angle) * 0.4, 0.2, Math.sin(angle) * 0.4]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.6, 0.08, 0.15]} />
              <meshStandardMaterial color="#1A1A1A" roughness={0.6} metalness={0.5} />
            </mesh>
          );
        })}
        {/* Center post */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
          <meshStandardMaterial color="#2A2A2A" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* Desk Lamp */}
      <group position={[-1.8, 0.87, -8]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 0.3, 16]} />
          <meshStandardMaterial color="#B8860B" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.4, 0.15]} rotation={[-0.5, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 16]} />
          <meshStandardMaterial color="#CD7F32" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.65, 0.35]} rotation={[-0.5, 0, 0]}>
          <coneGeometry args={[0.2, 0.25, 16]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.4} metalness={0.6} />
        </mesh>
        <pointLight position={[0, 0.5, 0.3]} intensity={1.5} color="#FFE4B5" distance={4} />
      </group>

      {/* Computer Monitor */}
      <group position={[0.5, 0.87, -8.5]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.2, 0.75, 0.08]} />
          <meshStandardMaterial color="#1F2937" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.4, 0.045]}>
          <planeGeometry args={[1.1, 0.65]} />
          <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.7} emissive="#1E293B" emissiveIntensity={0.3} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.2, 16]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* Bookshelf behind desk */}
      <group position={[8, 0, -10]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[3, 4, 0.5]} />
          <meshStandardMaterial color="#3D2817" roughness={0.7} />
        </mesh>
        {/* Books and binders */}
        {Array.from({ length: 18 }).map((_, i) => {
          const row = Math.floor(i / 6);
          const col = i % 6;
          return (
            <mesh 
              key={i} 
              position={[-1.2 + col * 0.45, 0.5 + row * 1.2, 0.3]} 
              castShadow
            >
              <boxGeometry args={[0.15, 0.7, 0.25]} />
              <meshStandardMaterial 
                color={['#1F2937', '#374151', '#4B5563', '#6B7280', '#8B4513', '#A0522D'][col]} 
                roughness={0.6} 
              />
            </mesh>
          );
        })}
      </group>

      {/* Filing Cabinet */}
      <group position={[-8, 0, -10]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[1.2, 1.8, 1.5]} />
          <meshStandardMaterial color="#4B5563" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Drawer handles */}
        {[0, 0.6, 1.2].map((y, i) => (
          <mesh key={i} position={[0, 0.1 + y, 0.8]} castShadow>
            <boxGeometry args={[0.4, 0.08, 0.08]} />
            <meshStandardMaterial color="#1F2937" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Window frame on wall */}
      <group position={[-12, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[3, 2.5, 0.15]} />
          <meshStandardMaterial color="#8B7355" roughness={0.6} />
        </mesh>
        {/* Glass panes */}
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[2.8, 2.3]} />
          <meshPhysicalMaterial
            color="#E6F3FF"
            roughness={0.05}
            transmission={0.85}
            thickness={0.5}
            transparent
          />
        </mesh>
      </group>

      {/* Wall Clock */}
      <group position={[0, 5.5, -12.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <circleGeometry args={[0.45, 32]} />
          <meshStandardMaterial color="#ECF0F1" roughness={0.7} />
        </mesh>
        {/* Hour hand */}
        <mesh ref={clockRef} position={[0, 0, 0.08]}>
          <boxGeometry args={[0.04, 0.2, 0.02]} />
          <meshStandardMaterial color="#1A1A1A" />
        </mesh>
      </group>

      {/* Conference chairs */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <group key={i} position={[x, 0, 2]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.9, 0.12, 0.9]} />
            <meshStandardMaterial color="#1F2937" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.9, -0.4]} castShadow>
            <boxGeometry args={[0.9, 0.8, 0.1]} />
            <meshStandardMaterial color="#1F2937" roughness={0.5} />
          </mesh>
          {/* Legs */}
          {[[-0.35, 0.35], [0.35, 0.35], [-0.35, -0.35], [0.35, -0.35]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.25, lz]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
              <meshStandardMaterial color="#0F172A" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Potted plant */}
      <group position={[10, 0, 5]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        {/* Plant leaves */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <mesh 
              key={i} 
              position={[Math.cos(angle) * 0.3, 0.9 + Math.sin(i) * 0.2, Math.sin(angle) * 0.3]}
              rotation={[angle * 0.3, angle, 0]}
              castShadow
            >
              <boxGeometry args={[0.15, 0.5, 0.02]} />
              <meshStandardMaterial color="#2D5016" roughness={0.6} />
            </mesh>
          );
        })}
      </group>
    </>
  );
}
