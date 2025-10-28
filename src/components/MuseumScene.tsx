import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import schoolLogo from '@/assets/school-of-law-logo.svg';
import herringboneFloor from '@/assets/textures/herringbone-parquet.svg';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
}

const DOORS = [
  { key: 'Alumni/Class Composites', position: [-7, 0, -6] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
  { key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', position: [7, 0, -6] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
  { key: 'Historical Photos/Archives', position: [-7, 0, 2] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] },
  { key: 'Faculty & Staff', position: [7, 0, 2] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] },
];

function WoodenDoor({ doorData, onDoorClick }: { 
  doorData: typeof DOORS[0]; 
  onDoorClick: (key: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={doorData.position} rotation={doorData.rotation}>
      {/* Door frame - ornate wood molding */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[2.4, 4.8, 0.15]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Door panels - two doors side by side */}
      {/* Left door */}
      <mesh position={[-0.55, 2.2, 0.08]}>
        <boxGeometry args={[1.0, 4.4, 0.12]} />
        <meshStandardMaterial color="#6B5635" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Upper panel on left door */}
      <mesh position={[-0.55, 3.3, 0.15]}>
        <boxGeometry args={[0.7, 1.6, 0.05]} />
        <meshStandardMaterial color="#7A6442" roughness={0.6} metalness={0.0} />
      </mesh>
      {/* Lower panel on left door */}
      <mesh position={[-0.55, 1.1, 0.15]}>
        <boxGeometry args={[0.7, 1.8, 0.05]} />
        <meshStandardMaterial color="#7A6442" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Right door */}
      <mesh position={[0.55, 2.2, 0.08]}>
        <boxGeometry args={[1.0, 4.4, 0.12]} />
        <meshStandardMaterial color="#6B5635" roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Upper panel on right door */}
      <mesh position={[0.55, 3.3, 0.15]}>
        <boxGeometry args={[0.7, 1.6, 0.05]} />
        <meshStandardMaterial color="#7A6442" roughness={0.6} metalness={0.0} />
      </mesh>
      {/* Lower panel on right door */}
      <mesh position={[0.55, 1.1, 0.15]}>
        <boxGeometry args={[0.7, 1.8, 0.05]} />
        <meshStandardMaterial color="#7A6442" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Door handles */}
      <mesh position={[-0.85, 2.2, 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.85, 2.2, 0.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Floating label above door */}
      <mesh position={[0, 4.8, 0.2]}>
        <planeGeometry args={[2.0, 0.8]} />
        <meshBasicMaterial transparent>
          <primitive attach="map" object={createLabelTexture(doorData.key)} />
        </meshBasicMaterial>
      </mesh>

      {/* Clickable area */}
      <mesh
        position={[0, 2.2, 0.15]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
      >
        <planeGeometry args={[2.2, 4.6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight position={[0, 2.2, 0.5]} intensity={1.5} color="#FFE8B8" distance={4} decay={2} />
      )}
    </group>
  );
}

function createLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 512;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3D3D3D';
  ctx.font = 'bold 60px Georgia, serif';
  
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > canvas.width - 100 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  const lineHeight = 70;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  const logoTexture = useTexture(schoolLogo);
  const floorTexture = useTexture(herringboneFloor);
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  useEffect(() => {
    logoTexture.anisotropy = 8;
    logoTexture.colorSpace = THREE.SRGBColorSpace;
    
    // Configure floor texture for herringbone pattern
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(8, 8);
    floorTexture.anisotropy = 16;
    floorTexture.colorSpace = THREE.SRGBColorSpace;
  }, [logoTexture, floorTexture]);
  
  const initialCameraPos = useRef(new THREE.Vector3(0, 2.5, 10));
  const targetCameraPos = useRef(new THREE.Vector3(0, 2.5, 10));
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
        targetCameraPos.current.set(door.position[0], 2.5, door.position[2] + 3);
        isAnimating.current = true;
        hasNotifiedComplete.current = false;
      }
    } else {
      targetCameraPos.current.copy(initialCameraPos.current);
      isAnimating.current = true;
      hasNotifiedComplete.current = false;
    }
  }, [selectedRoom]);

  const logoAspect = 577.88 / 199.75;
  const logoWidth = 5;
  const logoHeight = logoWidth / logoAspect;

  return (
    <>
      {/* Soft ambient base lighting */}
      <ambientLight intensity={0.8} color="#FFF5E8" />
      
      {/* Main soft hemisphere light for even illumination */}
      <hemisphereLight
        color="#FFF8F0"
        groundColor="#E8DCC8"
        intensity={1.2}
        position={[0, 8, 0]}
      />
      
      {/* Soft skylight - gentle top-down illumination */}
      <directionalLight
        position={[0, 10, 0]}
        intensity={1.5}
        color="#FFF5E8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={15}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        shadow-radius={8}
      />
      
      {/* Subtle fill lights for depth - very soft */}
      <pointLight position={[-8, 4, -6]} intensity={0.4} color="#FFF8F0" distance={18} decay={2} />
      <pointLight position={[8, 4, -6]} intensity={0.4} color="#FFF8F0" distance={18} decay={2} />
      <pointLight position={[-8, 4, 4]} intensity={0.4} color="#FFF8F0" distance={18} decay={2} />
      <pointLight position={[8, 4, 4]} intensity={0.4} color="#FFF8F0" distance={18} decay={2} />

      {/* Herringbone wood floor with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial 
          map={floorTexture}
          roughness={0.85}
          metalness={0.0}
        />
      </mesh>
      
      {/* Logo on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2]}>
        <planeGeometry args={[logoWidth, logoHeight]} />
        <meshStandardMaterial 
          map={logoTexture}
          transparent
          opacity={0.4}
          roughness={0.8}
        />
      </mesh>

      {/* Simple flat ceiling with soft skylight glow */}
      <group position={[0, 6, 0]}>
        {/* Main ceiling surface */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial 
            color="#F5EFE8" 
            roughness={0.95}
            emissive="#FFF9F0"
            emissiveIntensity={0.1}
          />
        </mesh>
      </group>

      {/* Smooth cream walls - single surface from floor to ceiling */}
      {/* Left wall */}
      <mesh position={[-12, 3, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial 
          color="#F5E8DC" 
          roughness={0.95}
        />
      </mesh>

      {/* Right wall */}
      <mesh position={[12, 3, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 6]} />
        <meshStandardMaterial 
          color="#F5E8DC" 
          roughness={0.95}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 3, -10]} receiveShadow>
        <planeGeometry args={[24, 6]} />
        <meshStandardMaterial 
          color="#F5E8DC" 
          roughness={0.95}
        />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, 3, 6]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[24, 6]} />
        <meshStandardMaterial 
          color="#F5E8DC" 
          roughness={0.95}
        />
      </mesh>

      {/* Wooden doors */}
      {DOORS.map((door) => (
        <WoodenDoor key={door.key} doorData={door} onDoorClick={onDoorClick} />
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
        enableZoom={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.48}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
        makeDefault
      />
    </>
  );
}
