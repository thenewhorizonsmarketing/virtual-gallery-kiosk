import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ArchiveRoom() {
  const dustRef = useRef<THREE.Points>(null);

  useFrame((state, delta) => {
    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <>
      {/* Archive Lighting - Dimmer, cooler */}
      <ambientLight intensity={0.35} color="#C5C9D1" />
      <directionalLight
        position={[5, 12, 8]}
        intensity={1.0}
        color="#D6DBE3"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Overhead fluorescent strip lights */}
      <rectAreaLight
        width={8}
        height={0.5}
        intensity={1.5}
        color="#E8F0F8"
        position={[0, 7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Floor - Concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[35, 30]} />
        <meshStandardMaterial color="#A8ADB5" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Walls - Industrial */}
      <mesh position={[0, 4, -15]} receiveShadow>
        <planeGeometry args={[35, 8]} />
        <meshStandardMaterial color="#B5BAC1" roughness={0.9} />
      </mesh>
      <mesh position={[-17.5, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#B5BAC1" roughness={0.9} />
      </mesh>
      <mesh position={[17.5, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 8]} />
        <meshStandardMaterial color="#B5BAC1" roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[35, 30]} />
        <meshStandardMaterial color="#9FA4AC" roughness={0.9} />
      </mesh>

      {/* Metal Filing Cabinets - Left side */}
      {[-10, -6, -2].map((z, i) => (
        <group key={`left-${i}`} position={[-12, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1.2, 2.4, 1.8]} />
            <meshStandardMaterial color="#6B7280" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Drawer handles */}
          {[0, 0.6, 1.2].map((y, di) => (
            <mesh key={di} position={[0, 0.2 + y, 0.95]} castShadow>
              <boxGeometry args={[0.3, 0.08, 0.08]} />
              <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Metal Filing Cabinets - Right side */}
      {[-10, -6, -2].map((z, i) => (
        <group key={`right-${i}`} position={[12, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[1.2, 2.4, 1.8]} />
            <meshStandardMaterial color="#6B7280" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Drawer handles */}
          {[0, 0.6, 1.2].map((y, di) => (
            <mesh key={di} position={[0, 0.2 + y, 0.95]} castShadow>
              <boxGeometry args={[0.3, 0.08, 0.08]} />
              <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Document Storage Boxes on Shelves - Back wall */}
      <group position={[0, 0, -13]}>
        {/* Shelf structure */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[14, 4, 0.6]} />
          <meshStandardMaterial color="#4B5563" roughness={0.6} metalness={0.5} />
        </mesh>
        
        {/* Document boxes */}
        {Array.from({ length: 15 }).map((_, i) => {
          const x = -6 + (i % 5) * 2.8;
          const y = 1 + Math.floor(i / 5) * 1.2;
          return (
            <mesh key={i} position={[x, y, 0.4]} castShadow>
              <boxGeometry args={[0.8, 0.9, 0.5]} />
              <meshStandardMaterial color="#D1D5DB" roughness={0.7} />
            </mesh>
          );
        })}
      </group>

      {/* Sorting Table in center */}
      <group position={[0, 0, -4]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[6, 0.08, 3]} />
          <meshStandardMaterial color="#8B9299" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Metal legs */}
        {[[-2.8, -1.3], [2.8, -1.3], [-2.8, 1.3], [2.8, 1.3]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.45, z]} castShadow>
            <boxGeometry args={[0.1, 0.9, 0.1]} />
            <meshStandardMaterial color="#4B5563" roughness={0.4} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Scattered documents on table */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + i * 0.3;
        const radius = 0.8 + Math.random() * 0.6;
        return (
          <mesh 
            key={i} 
            position={[Math.cos(angle) * radius, 0.95, -4 + Math.sin(angle) * radius]} 
            rotation={[-Math.PI / 2, 0, angle + Math.random() * 0.5]}
            castShadow
          >
            <planeGeometry args={[0.6, 0.8]} />
            <meshStandardMaterial color="#F3F4F6" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Rolling ladder */}
      <group position={[-8, 0, -10]}>
        {/* Rails */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.08, 3, 0.08]} />
          <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.8, 1.5, 0]} castShadow>
          <boxGeometry args={[0.08, 3, 0.08]} />
          <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.6} />
        </mesh>
        {/* Steps */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0.4, 0.4 + i * 0.5, 0]} castShadow>
            <boxGeometry args={[0.8, 0.05, 0.3]} />
            <meshStandardMaterial color="#6B7280" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Dust particles */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={400}
            array={new Float32Array(
              Array.from({ length: 400 * 3 }, () => (Math.random() - 0.5) * 30)
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color="#C5C9D1"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </points>

      {/* Industrial cart */}
      <group position={[6, 0, -2]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[1.2, 0.1, 2]} />
          <meshStandardMaterial color="#6B7280" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Wheels */}
        {[[-0.5, -0.8], [0.5, -0.8], [-0.5, 0.8], [0.5, 0.8]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.15, 16]} />
            <meshStandardMaterial color="#1F2937" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </>
  );
}
