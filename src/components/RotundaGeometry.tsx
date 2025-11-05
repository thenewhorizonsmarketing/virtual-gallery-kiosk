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
  // Calculate column positions - only between doorways
  const columnPositions = useMemo(() => {
    const positions: Array<{ x: number; z: number; angle: number }> = [];
    const columnsPerSegment = 2; // 2 columns per wall segment = 8 total
    const safetyMargin = Math.PI / 24; // 7.5° margin from doorway edges
    
    // For each pair of adjacent doorways, create a wall segment
    for (let i = 0; i < DOORWAY_ANGLES.length; i++) {
      const doorAngle = DOORWAY_ANGLES[i];
      const nextDoorAngle = DOORWAY_ANGLES[(i + 1) % DOORWAY_ANGLES.length];
      
      // Calculate wall segment boundaries (after this door, before next door)
      const segmentStart = doorAngle + DOORWAY_WIDTH / 2 + safetyMargin;
      let segmentEnd = nextDoorAngle - DOORWAY_WIDTH / 2 - safetyMargin;
      
      // Handle wrap-around for the last segment
      if (segmentEnd < segmentStart) {
        segmentEnd += Math.PI * 2;
      }
      
      const segmentSpan = segmentEnd - segmentStart;
      
      // Place columns evenly within this wall segment
      for (let j = 0; j < columnsPerSegment; j++) {
        const angle = segmentStart + (segmentSpan * (j + 0.5) / columnsPerSegment);
        const normalizedAngle = angle % (Math.PI * 2);
        
        positions.push({
          x: Math.cos(normalizedAngle) * (radius - 1),
          z: Math.sin(normalizedAngle) * (radius - 1),
          angle: normalizedAngle,
        });
      }
    }
    
    return positions;
  }, [radius]);

  return (
    <group>
      {/* Circular Floor with Radial Pattern */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial 
          color="#F5F5DC"
          roughness={0.4}
          metalness={0.05}
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
            castShadow
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
          castShadow
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
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* Columns with square plinths - positioned in wall segments only */}
      {columnPositions.map((pos, i) => {
        const FLOOR_Y = 0;
        const CEILING_HEIGHT = 8;
        const BASE_HEIGHT = 0.6;
        const CAPITAL_HEIGHT = 0.45;
        const ABACUS_HEIGHT = 0.15;
        const SHAFT_HEIGHT = CEILING_HEIGHT - BASE_HEIGHT - CAPITAL_HEIGHT - ABACUS_HEIGHT;

        const baseY = FLOOR_Y + BASE_HEIGHT / 2;
        const shaftY = FLOOR_Y + BASE_HEIGHT + SHAFT_HEIGHT / 2;
        const capitalY = FLOOR_Y + BASE_HEIGHT + SHAFT_HEIGHT + CAPITAL_HEIGHT / 2;
        const abacusY = FLOOR_Y + BASE_HEIGHT + SHAFT_HEIGHT + CAPITAL_HEIGHT + ABACUS_HEIGHT / 2;

        return (
          <group key={`column-${i}`} position={[pos.x, 0, pos.z]}>
            {/* Square plinth base */}
            <mesh castShadow receiveShadow position={[0, baseY, 0]}>
              <boxGeometry args={[1, BASE_HEIGHT, 1]} />
              <meshStandardMaterial
                color="#D6CEC5"
                roughness={0.55}
              />
            </mesh>

            {/* Column shaft with subtle entasis */}
            <mesh position={[0, shaftY, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.35, SHAFT_HEIGHT, 32]} />
              <meshStandardMaterial
                color="#F5F1EA"
                roughness={0.45}
                metalness={0.05}
              />
            </mesh>

            {/* Column capital (echinus) */}
            <mesh position={[0, capitalY, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.42, CAPITAL_HEIGHT, 32]} />
              <meshStandardMaterial
                color="#E0D6CB"
                roughness={0.5}
              />
            </mesh>

            {/* Column capital abacus */}
            <mesh position={[0, abacusY, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.1, ABACUS_HEIGHT, 1.1]} />
              <meshStandardMaterial
                color="#D6CEC5"
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}


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
            castShadow
            receiveShadow
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


      {/* Doorway title text - curved along the wall */}
      {DOORWAY_ANGLES.map((angle, i) => {
        const title = DOORWAY_TITLES[i];
        const textRadius = radius + 0.48; // Just inside the inner wall
        const arcLength = DOORWAY_WIDTH * textRadius * 0.9; // Stay within doorway

        return (
          <group key={`doorway-title-${i}`} rotation={[0, angle, 0]} renderOrder={10}>
            <Text
              position={[textRadius, 5.6, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              fontSize={0.9}
              color="#2C3E50"
              anchorX="center"
              anchorY="middle"
              textAlign="center"
              maxWidth={arcLength}
              letterSpacing={0.03}
              outlineWidth={0.02}
              outlineColor="#FFFFFF"
              depthOffset={-1}
            >
              {title}
            </Text>
          </group>
        );
      })}

      {/* Dome ceiling */}
      <mesh position={[0, 8, 0]} rotation={[0, 0, 0]} receiveShadow>
        <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#F0F0F0"
          roughness={0.6}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Oculus (circular skylight at top) */}
      <mesh position={[0, 8.5, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial 
          color="#8B7355"
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}
