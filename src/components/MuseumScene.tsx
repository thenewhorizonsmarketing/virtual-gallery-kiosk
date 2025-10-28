import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
}

// Door positions for clickable areas (will be adjusted based on GLTF model inspection)
const DOORS = [
  { key: 'Alumni/Class Composites', position: [-3, 2, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
  { key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', position: [3, 2, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
  { key: 'Historical Photos/Archives', position: [-3, 2, -2] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
  { key: 'Faculty & Staff', position: [3, 2, -2] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
];

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  // Load the GLTF room model
  const { scene: gltfScene } = useGLTF('/room_packshot.glb');
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  const initialCameraPos = useRef(new THREE.Vector3(0, 2, 0));
  const targetCameraPos = useRef(new THREE.Vector3(0, 2, 0));
  const isAnimating = useRef(false);
  const hasNotifiedComplete = useRef(false);

  const particlesGeometry = useMemo(() => {
    const positions = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24; // x
      positions[i * 3 + 1] = Math.random() * 6; // y - from floor to ceiling
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24; // z
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  // Handle camera zoom animations and particle movement
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.01;
      
      // Animate particles floating up
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.05; // Slow upward drift
        
        // Reset particle when it reaches ceiling
        if (positions[i + 1] > 6) {
          positions[i + 1] = 0;
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
        targetCameraPos.current.set(door.position[0], 2, door.position[2] + 2.5);
        isAnimating.current = true;
        hasNotifiedComplete.current = false;
      }
    } else {
      targetCameraPos.current.copy(initialCameraPos.current);
      isAnimating.current = true;
      hasNotifiedComplete.current = false;
    }
  }, [selectedRoom]);

  return (
    <>
      {/* Enhanced ambient lighting for the GLTF model */}
      <ambientLight intensity={1.2} color="#FFFFFF" />
      
      {/* Main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        color="#FFFFFF"
        castShadow
      />
      
      {/* Fill lights */}
      <pointLight position={[-3, 3, 3]} intensity={0.8} color="#FFF8F0" distance={15} decay={2} />
      <pointLight position={[3, 3, 3]} intensity={0.8} color="#FFF8F0" distance={15} decay={2} />

      {/* GLTF Room Model - duplicated to create complete room */}
      {/* Front wall */}
      <primitive 
        object={gltfScene.clone()} 
        scale={[2, 2, 2]} 
        position={[0, 0, 4]}
        rotation={[0, 0, 0]}
      />
      
      {/* Back wall */}
      <primitive 
        object={gltfScene.clone()} 
        scale={[2, 2, 2]} 
        position={[0, 0, -4]}
        rotation={[0, Math.PI, 0]}
      />
      
      {/* Left wall */}
      <primitive 
        object={gltfScene.clone()} 
        scale={[2, 2, 2]} 
        position={[-4, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      
      {/* Right wall */}
      <primitive 
        object={gltfScene.clone()} 
        scale={[2, 2, 2]} 
        position={[4, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Invisible clickable door areas positioned over GLTF doors */}
      {DOORS.map((door) => (
        <mesh
          key={door.key}
          position={door.position}
          rotation={door.rotation}
          onClick={() => onDoorClick(door.key)}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <planeGeometry args={[2, 4]} />
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
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.5}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
        makeDefault
      />
    </>
  );
}
