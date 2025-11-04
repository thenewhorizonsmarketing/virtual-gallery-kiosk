import * as THREE from 'three';
import { useMemo } from 'react';
import { Text } from '@react-three/drei';

interface RotundaGeometryProps {
  radius?: number;
  columnCount?: number;
}

// 4 doorway positions at cardinal directions
const DOORWAY_ANGLES = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
const DOORWAY_WIDTH = Math.PI / 6; // Width of each doorway opening (30 degrees)
const DOORWAY_TITLES = ['Alumni', 'Publications', 'Archives', 'Faculty'];

export function RotundaGeometry({ radius = 10, columnCount = 12 }: RotundaGeometryProps) {
  // Calculate column positions - evenly spaced around the rotunda
  const columnPositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; angle: number }> = [];
    
    // Evenly space columns around the rotunda
    for (let i = 0; i < columnCount; i++) {
      const angle = (i / columnCount) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * (radius - 1),
        z: Math.sin(angle) * (radius - 1),
        angle: angle,
      });
    }
    
    return positions;
  }, [radius, columnCount]);

  // Calculate arch positions - connect all adjacent columns
  const archPositions = useMemo(() => {
    const positions: Array<{ 
      x: number; 
      z: number; 
      angle: number;
    }> = [];
    
    // Create arches between all adjacent columns
    for (let i = 0; i < columnPositions.length; i++) {
      const col1 = columnPositions[i];
      const col2 = columnPositions[(i + 1) % columnPositions.length];
      
      const midAngle = (col1.angle + col2.angle) / 2;
      positions.push({
        x: Math.cos(midAngle) * (radius - 1),
        z: Math.sin(midAngle) * (radius - 1),
        angle: midAngle,
      });
    }
    
    return positions;
  }, [columnPositions, radius]);


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

      {/* Arches connecting adjacent columns */}
      {archPositions.map((pos, i) => (
        <group key={`arch-${i}`} position={[pos.x, 5.8, pos.z]} rotation={[0, pos.angle + Math.PI / 2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[1.2, 0.25, 16, 32, Math.PI]} />
            <meshStandardMaterial 
              color="#C0C0C0"
              roughness={0.7}
            />
          </mesh>
        </group>
      ))}

      {/* Wall segments between doorways (with gaps for doorways) */}
      {DOORWAY_ANGLES.map((doorAngle, i) => {
        // Calculate wall segment angle span (between this door and next door)
        const nextDoorAngle = DOORWAY_ANGLES[(i + 1) % DOORWAY_ANGLES.length];
        const wallStartAngle = doorAngle + DOORWAY_WIDTH / 2;
        let wallArcLength = nextDoorAngle - DOORWAY_WIDTH / 2 - wallStartAngle;
        
        // Handle wrap-around for the last segment
        if (wallArcLength < 0) {
          wallArcLength += Math.PI * 2;
        }
        
        return (
          <mesh 
            key={`wall-segment-${i}`} 
            position={[0, 4, 0]}
            rotation={[0, wallStartAngle, 0]}
          >
            <cylinderGeometry 
              args={[
                radius + 0.5, 
                radius + 0.5, 
                8, 
                16, 
                1, 
                true, 
                0, 
                wallArcLength
              ]} 
            />
            <meshStandardMaterial 
              color="#E8E8E8"
              roughness={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}


      {/* Doorway title text */}
      {DOORWAY_ANGLES.map((angle, i) => {
        const x = Math.cos(angle) * (radius + 0.5);
        const z = Math.sin(angle) * (radius + 0.5);
        
        return (
          <Text
            key={`doorway-title-${i}`}
            position={[x * 1.15, 5.8, z * 1.15]}
            rotation={[0, angle + Math.PI, 0]}
            fontSize={1.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.08}
            outlineColor="#000000"
          >
            {DOORWAY_TITLES[i]}
          </Text>
        );
      })}

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
