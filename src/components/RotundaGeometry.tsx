import * as THREE from 'three';
import { useMemo } from 'react';

interface RotundaGeometryProps {
  radius?: number;
  columnCount?: number;
}

export function RotundaGeometry({ radius = 10, columnCount = 12 }: RotundaGeometryProps) {
  // Calculate column positions in a circle
  const columnPositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; angle: number }> = [];
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * (radius - 1),
        z: Math.sin(angle) * (radius - 1),
        angle,
      });
    }
    return positions;
  }, [columnCount, radius]);

  // Calculate arch positions between columns
  const archPositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; angle: number }> = [];
    for (let i = 0; i < columnCount; i++) {
      const angle = ((i + 0.5) / columnCount) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * (radius - 1),
        z: Math.sin(angle) * (radius - 1),
        angle,
      });
    }
    return positions;
  }, [columnCount, radius]);

  // Calculate niche positions (4 main display areas)
  const nichePositions = useMemo(() => {
    return [
      { angle: 0, x: Math.cos(0) * radius, z: Math.sin(0) * radius },
      { angle: Math.PI / 2, x: Math.cos(Math.PI / 2) * radius, z: Math.sin(Math.PI / 2) * radius },
      { angle: Math.PI, x: Math.cos(Math.PI) * radius, z: Math.sin(Math.PI) * radius },
      { angle: Math.PI * 1.5, x: Math.cos(Math.PI * 1.5) * radius, z: Math.sin(Math.PI * 1.5) * radius },
    ];
  }, [radius]);

  return (
    <group>
      {/* Circular Floor with Radial Pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial 
          color="#F5F5DC"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Radial floor inlay pattern */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh 
            key={`radial-${i}`}
            rotation={[-Math.PI / 2, 0, angle]}
            position={[0, 0.01, 0]}
          >
            <planeGeometry args={[0.1, radius * 2]} />
            <meshStandardMaterial 
              color="#D2B48C"
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* Concentric circle patterns */}
      {[3, 6, 9].map((r) => (
        <mesh 
          key={`circle-${r}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
        >
          <ringGeometry args={[r - 0.05, r + 0.05, 64]} />
          <meshStandardMaterial 
            color="#C19A6B"
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Central Dais - raised platform */}
      <group position={[0, 0.15, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[3, 3.2, 0.3, 32]} />
          <meshStandardMaterial 
            color="#FFFFFF"
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Columns with square plinths */}
      {columnPositions.map((pos, i) => (
        <group key={`column-${i}`} position={[pos.x, 0, pos.z]}>
          {/* Square plinth base */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial 
              color="#D3D3D3"
              roughness={0.6}
            />
          </mesh>

          {/* Round column */}
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 5, 16]} />
            <meshStandardMaterial 
              color="#E8E8E8"
              roughness={0.5}
            />
          </mesh>

          {/* Column capital (top) */}
          <mesh position={[0, 5.6, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.35, 0.4, 16]} />
            <meshStandardMaterial 
              color="#D3D3D3"
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Heavy arches between columns */}
      {archPositions.map((pos, i) => (
        <group key={`arch-${i}`} position={[pos.x, 5.8, pos.z]} rotation={[0, pos.angle, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[1.2, 0.25, 16, 32, Math.PI]} />
            <meshStandardMaterial 
              color="#C0C0C0"
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Outer wall behind columns */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[radius + 0.5, radius + 0.5, 8, 64, 1, true]} />
        <meshStandardMaterial 
          color="#E8E8E8"
          roughness={0.7}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Wall niches (recessed alcoves) */}
      {nichePositions.map((pos, i) => (
        <group key={`niche-${i}`} position={[pos.x * 0.9, 2.5, pos.z * 0.9]} rotation={[0, -pos.angle, 0]}>
          {/* Niche recess */}
          <mesh position={[0, 0, -0.5]}>
            <boxGeometry args={[2.5, 3.5, 1]} />
            <meshStandardMaterial 
              color="#D8D8D8"
              roughness={0.6}
            />
          </mesh>
          
          {/* Niche pedestal */}
          <mesh position={[0, -1.2, -0.3]} castShadow>
            <boxGeometry args={[1, 0.8, 0.6]} />
            <meshStandardMaterial 
              color="#B8B8B8"
              roughness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* Dome ceiling */}
      <mesh position={[0, 8, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#F0F0F0"
          roughness={0.6}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Oculus (circular skylight at top) */}
      <mesh position={[0, 8.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial 
          color="#8B7355"
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
