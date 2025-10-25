import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function LibraryRoom() {
  const booksRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (booksRef.current) {
      // Subtle ambient movement
      booksRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.02;
    }
  });

  return (
    <>
      {/* Library Lighting */}
      <ambientLight intensity={0.5} color="#E8DCC8" />
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.5}
        color="#FFF8E7"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 3, 2]} intensity={0.8} color="#FFD699" distance={12} />

      {/* Floor - Wood Parquet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.4} metalness={0.0} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 4, -15]} receiveShadow>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color="#D4C5B0" roughness={0.8} />
      </mesh>
      <mesh position={[-20, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#D4C5B0" roughness={0.8} />
      </mesh>
      <mesh position={[20, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#D4C5B0" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#C4B5A0" roughness={0.7} />
      </mesh>

      {/* Bookshelves Group */}
      <group ref={booksRef}>
        {/* Left Bookshelf */}
        <group position={[-12, 0, -10]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[2, 4, 0.4]} />
            <meshStandardMaterial color="#3D2817" roughness={0.7} />
          </mesh>
          {/* Books */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[-0.7 + i * 0.5, 1 + i * 0.8, 0.25]} castShadow>
              <boxGeometry args={[0.15, 0.6, 0.3]} />
              <meshStandardMaterial 
                color={['#8B4513', '#654321', '#A0522D', '#CD853F'][i]} 
                roughness={0.6} 
              />
            </mesh>
          ))}
        </group>

        {/* Right Bookshelf */}
        <group position={[12, 0, -10]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[2, 4, 0.4]} />
            <meshStandardMaterial color="#3D2817" roughness={0.7} />
          </mesh>
          {/* Books */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`right-${i}`} position={[-0.7 + i * 0.5, 1 + i * 0.8, 0.25]} castShadow>
              <boxGeometry args={[0.15, 0.6, 0.3]} />
              <meshStandardMaterial 
                color={['#654321', '#8B4513', '#CD853F', '#A0522D'][i]} 
                roughness={0.6} 
              />
            </mesh>
          ))}
        </group>

        {/* Center Bookshelf */}
        <group position={[0, 0, -12]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[6, 4, 0.4]} />
            <meshStandardMaterial color="#3D2817" roughness={0.7} />
          </mesh>
          {/* Books rows */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={`center-${i}`} position={[-2.5 + (i % 6) * 0.9, 1 + Math.floor(i / 6) * 1.2, 0.25]} castShadow>
              <boxGeometry args={[0.2, 0.7, 0.3]} />
              <meshStandardMaterial 
                color={['#8B4513', '#654321', '#A0522D', '#CD853F', '#DEB887', '#D2691E'][i % 6]} 
                roughness={0.6} 
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* Reading Table */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[4, 0.1, 2]} />
          <meshStandardMaterial color="#6B4423" roughness={0.5} />
        </mesh>
        {/* Table Legs */}
        {[[-1.8, -1], [1.8, -1], [-1.8, 1], [1.8, 1]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.4, z]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
            <meshStandardMaterial color="#4A2F1A" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Desk Lamp */}
      <group position={[1.5, 0.85, -2]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 6]}>
          <coneGeometry args={[0.25, 0.3, 16]} />
          <meshStandardMaterial color="#34495E" roughness={0.3} metalness={0.7} />
        </mesh>
        <pointLight position={[0, 0.4, 0]} intensity={1.2} color="#FFE4B5" distance={3} />
      </group>

      {/* Leather Chairs */}
      {[-1.5, 1.5].map((x, i) => (
        <group key={i} position={[x, 0, -0.5]}>
          {/* Seat */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.15, 0.8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.6} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.9, -0.35]} castShadow>
            <boxGeometry args={[0.8, 0.8, 0.1]} />
            <meshStandardMaterial color="#5D4037" roughness={0.6} />
          </mesh>
          {/* Legs */}
          {[[-0.3, 0.3], [0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.25, lz]}>
              <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
              <meshStandardMaterial color="#3E2723" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Chandelier */}
      <group position={[0, 6.5, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.3, 1, 8]} />
          <meshStandardMaterial color="#B8860B" roughness={0.2} metalness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(angle) * 0.8, -0.3, Math.sin(angle) * 0.8]}>
              <mesh>
                <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
                <meshStandardMaterial color="#CD7F32" roughness={0.3} metalness={0.7} />
              </mesh>
              <pointLight position={[0, -0.2, 0]} intensity={0.4} color="#FFE4B5" distance={6} />
            </group>
          );
        })}
      </group>

      {/* Globe on side table */}
      <group position={[-8, 0, -4]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial color="#6B4423" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#4A7C8C" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>
    </>
  );
}
