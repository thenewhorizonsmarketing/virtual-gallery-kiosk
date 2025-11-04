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
  // Calculate column positions - 2 columns flanking each of 4 doorways (8 total)
  const columnPositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; angle: number }> = [];
    
    // Place 2 columns on each side of each doorway (8 columns total)
    DOORWAY_ANGLES.forEach(doorAngle => {
      // Column to the left of doorway - positioned further away for clear opening
      const leftAngle = doorAngle - DOORWAY_WIDTH - 0.3;
      positions.push({
        x: Math.cos(leftAngle) * (radius - 1),
        z: Math.sin(leftAngle) * (radius - 1),
        angle: leftAngle,
      });
      
      // Column to the right of doorway - positioned further away for clear opening
      const rightAngle = doorAngle + DOORWAY_WIDTH + 0.3;
      positions.push({
        x: Math.cos(rightAngle) * (radius - 1),
        z: Math.sin(rightAngle) * (radius - 1),
        angle: rightAngle,
      });
    });
    
    return positions;
  }, [radius]);

  // Calculate arch positions - arches connect adjacent columns within each section
  const archPositions = useMemo(() => {
    const positions: Array<{ 
      x: number; 
      z: number; 
      angle: number;
      col1: number;
      col2: number;
    }> = [];
    
    // Create arches between adjacent column pairs (4 arches total, one per section)
    for (let i = 0; i < columnPositions.length - 1; i += 2) {
      const col1 = columnPositions[i];
      const col2 = columnPositions[i + 1];
      
      // Position arch midway between the two columns
      const midAngle = (col1.angle + col2.angle) / 2;
      positions.push({
        x: Math.cos(midAngle) * (radius - 1),
        z: Math.sin(midAngle) * (radius - 1),
        angle: midAngle,
        col1: i,
        col2: i + 1,
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

      {/* Door frames at each entrance */}
      {DOORWAY_ANGLES.map((angle, i) => {
        const x = Math.cos(angle) * (radius + 0.5);
        const z = Math.sin(angle) * (radius + 0.5);
        
        return (
          <group 
            key={`doorway-${i}`} 
            position={[x, 0, z]} 
            rotation={[0, angle + Math.PI, 0]}
          >
            {/* Left door jamb */}
            <mesh position={[-1.5, 2.5, 0]} castShadow>
              <boxGeometry args={[0.3, 5, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" roughness={0.6} />
            </mesh>
            
            {/* Right door jamb */}
            <mesh position={[1.5, 2.5, 0]} castShadow>
              <boxGeometry args={[0.3, 5, 0.5]} />
              <meshStandardMaterial color="#C0C0C0" roughness={0.6} />
            </mesh>
            
            {/* Door lintel (top beam) */}
            <mesh position={[0, 5, 0]} castShadow>
              <boxGeometry args={[3.3, 0.5, 0.5]} />
              <meshStandardMaterial color="#B0B0B0" roughness={0.6} />
            </mesh>
            
            {/* Door threshold (floor) */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[3, 0.1, 0.6]} />
              <meshStandardMaterial color="#A0A0A0" roughness={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Doorway title text with background plates */}
      {DOORWAY_ANGLES.map((angle, i) => {
        const x = Math.cos(angle) * (radius + 0.5);
        const z = Math.sin(angle) * (radius + 0.5);
        
        return (
          <group key={`doorway-title-group-${i}`}>
            {/* Dark background plate for contrast */}
            <mesh position={[x * 1.08, 5.8, z * 1.08]} rotation={[0, angle + Math.PI, 0]}>
              <planeGeometry args={[3.5, 1]} />
              <meshStandardMaterial color="#1a1a1a" opacity={0.7} transparent />
            </mesh>
            
            {/* Title text - positioned forward from wall */}
            <Text
              position={[x * 1.08, 5.8, z * 1.08]}
              rotation={[0, angle + Math.PI, 0]}
              fontSize={0.8}
              color="white"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.05}
              outlineWidth={0.05}
              outlineColor="#000000"
              outlineOpacity={0.8}
            >
              {DOORWAY_TITLES[i]}
            </Text>
          </group>
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
