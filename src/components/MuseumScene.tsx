import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useResponsive } from '@/hooks/useResponsive';
import { RotundaGeometry } from './RotundaGeometry';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
}

// Helper function to calculate niche positions in rotunda
const calculateNichePosition = (angle: number, radius: number = 9): [number, number, number] => {
  return [
    Math.cos(angle) * radius,
    2.5,
    Math.sin(angle) * radius
  ];
};

// Niche positions for clickable areas (4 main display niches in rotunda)
const DOORS = [
  { 
    key: 'Alumni/Class Composites', 
    position: calculateNichePosition(0), 
    rotation: [0, Math.PI, 0] as [number, number, number] 
  },
  { 
    key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', 
    position: calculateNichePosition(Math.PI / 2), 
    rotation: [0, -Math.PI / 2, 0] as [number, number, number] 
  },
  { 
    key: 'Historical Photos/Archives', 
    position: calculateNichePosition(Math.PI), 
    rotation: [0, 0, 0] as [number, number, number] 
  },
  { 
    key: 'Faculty & Staff', 
    position: calculateNichePosition(Math.PI * 1.5), 
    rotation: [0, Math.PI / 2, 0] as [number, number, number] 
  },
];

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  const responsive = useResponsive();
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  const initialCameraPos = useRef(new THREE.Vector3(0, 2, 0));
  const targetCameraPos = useRef(new THREE.Vector3(0, 2, 0));
  const isAnimating = useRef(false);
  const hasNotifiedComplete = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);

  const particlesGeometry = useMemo(() => {
    const count = responsive.particleCount;
    const positions = new Float32Array(count * 3);
    const rotundaRadius = 10;
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in cylindrical volume (rotunda shape)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * rotundaRadius;
      positions[i * 3] = Math.cos(angle) * radius; // x
      positions[i * 3 + 1] = Math.random() * 8; // y - from floor to dome
      positions[i * 3 + 2] = Math.sin(angle) * radius; // z
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [responsive.particleCount]);

  // Handle camera zoom animations and particle movement
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.01;
      
      // Animate dust motes floating up in light shafts
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.03; // Slower drift for dust motes
        
        // Subtle circular drift
        positions[i] += Math.sin(positions[i + 1] * 0.5) * delta * 0.02;
        positions[i + 2] += Math.cos(positions[i + 1] * 0.5) * delta * 0.02;
        
        // Reset particle when it reaches dome
        if (positions[i + 1] > 8) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 10;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = 0;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Only animate camera when actively transitioning to/from a door
    if (isAnimating.current) {
      // Smooth camera transition with easing
      const lerpFactor = 1 - Math.pow(0.001, delta); // Smooth easing
      camera.position.lerp(targetCameraPos.current, lerpFactor);
      
      // Check if animation is complete
      const distance = camera.position.distanceTo(targetCameraPos.current);
      if (distance < 0.01) {
        isAnimating.current = false;
        // Update target to current position to prevent snapping back
        targetCameraPos.current.copy(camera.position);
        if (selectedRoom && !hasNotifiedComplete.current && onZoomComplete) {
          hasNotifiedComplete.current = true;
          onZoomComplete(selectedRoom);
        }
      }
    }
  });
  
  useEffect(() => {
    if (selectedRoom) {
      const door = DOORS.find(d => d.key === selectedRoom);
      if (door) {
        const newTarget = new THREE.Vector3(door.position[0], 2, door.position[2] + 2.5);
        const distance = camera.position.distanceTo(newTarget);
        
        // Only animate if we're actually moving somewhere (distance > 0.5 units)
        if (distance > 0.5) {
          targetCameraPos.current.copy(newTarget);
          isAnimating.current = true;
          hasNotifiedComplete.current = false;
        }
      }
    } else {
      const distance = camera.position.distanceTo(initialCameraPos.current);
      
      // Only animate back to center if we're not already there
      if (distance > 0.5) {
        targetCameraPos.current.copy(initialCameraPos.current);
        isAnimating.current = true;
        hasNotifiedComplete.current = false;
      }
    }
  }, [selectedRoom, camera]);

  return (
    <>
      {/* Cool bluish key light from above */}
      <directionalLight
        position={[8, 12, 5]}
        intensity={2.5}
        color="#B0C4DE"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Warm fill lights around columns */}
      <pointLight position={[-8, 4, 8]} intensity={0.7} color="#FFE4C4" distance={20} decay={2} />
      <pointLight position={[8, 4, 8]} intensity={0.7} color="#FFE4C4" distance={20} decay={2} />
      <pointLight position={[-8, 4, -8]} intensity={0.7} color="#FFE4C4" distance={20} decay={2} />
      <pointLight position={[8, 4, -8]} intensity={0.7} color="#FFE4C4" distance={20} decay={2} />
      
      {/* Low ambient base light */}
      <ambientLight intensity={0.3} color="#FFF8F0" />
      
      {/* Accent spotlights in niches */}
      {DOORS.map((door) => (
        <spotLight
          key={`spotlight-${door.key}`}
          position={[door.position[0] * 0.7, 4, door.position[2] * 0.7]}
          target-position={door.position}
          intensity={1.2}
          angle={0.4}
          penumbra={0.5}
          color="#FFFFFF"
          distance={15}
          decay={2}
        />
      ))}

      {/* Procedural Rotunda Geometry */}
      <RotundaGeometry radius={10} columnCount={12} />

      {/* Invisible clickable door areas - larger on mobile */}
      {DOORS.map((door) => (
        <mesh
          key={door.key}
          position={door.position}
          rotation={door.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onDoorClick(door.key);
            // Haptic feedback on mobile
            if (responsive.isMobile && 'vibrate' in navigator) {
              navigator.vibrate(50);
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!responsive.isMobile) {
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <planeGeometry args={responsive.isMobile ? [2.5, 5] : [2, 4]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}

      {/* Atmospheric dust particles */}
      <points ref={particlesRef}>
        <bufferGeometry {...particlesGeometry} />
        <pointsMaterial
          size={0.025}
          color="#FFF8E8"
          transparent
          opacity={0.25}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <OrbitControls
        target={[0, 2.5, 0]}
        enablePan={false}
        enableZoom={true}
        minDistance={0.1}
        maxDistance={15}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.65}
        rotateSpeed={responsive.isMobile ? 0.7 : 0.5}
        enableDamping
        dampingFactor={responsive.isMobile ? 0.08 : 0.06}
        makeDefault
      />
    </>
  );
}
